import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// USER ROUTES
// ========================================

// Lấy số dư và lịch sử giao dịch
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance');
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      balance: user.balance || 0,
      transactions: recentTransactions
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy lịch sử giao dịch đầy đủ
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('order', 'orderCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo yêu cầu nạp xu (tạo pending transaction)
router.post('/deposit/request', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 10000) {
      return res.status(400).json({ message: 'Số tiền nạp tối thiểu là 10,000đ' });
    }
    
    if (amount > 10000000) {
      return res.status(400).json({ message: 'Số tiền nạp tối đa là 10,000,000đ' });
    }

    const user = await User.findById(req.user._id);
    const depositCode = `NAP${req.user._id.toString().slice(-6).toUpperCase()}${Date.now().toString().slice(-6)}`;
    
    // Tạo transaction pending
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount,
      balanceBefore: user.balance || 0,
      balanceAfter: (user.balance || 0) + amount,
      description: `Nạp ${amount.toLocaleString('vi-VN')}đ vào tài khoản`,
      status: 'pending',
      paymentInfo: {
        content: depositCode
      }
    });
    
    await transaction.save();

    // Generate VietQR
    const bankId = process.env.VIETQR_BANK_ID || '970422';
    const accountNo = process.env.VIETQR_ACCOUNT_NO || '0123456789';
    const accountName = process.env.VIETQR_ACCOUNT_NAME || 'AI STORE';
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(depositCode)}&accountName=${encodeURIComponent(accountName)}`;

    res.json({
      transaction: {
        _id: transaction._id,
        amount,
        depositCode,
        status: 'pending'
      },
      payment: {
        qrUrl,
        bankId,
        accountNo,
        accountName,
        content: depositCode,
        amount
      }
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ========================================
// ADMIN ROUTES
// ========================================

// Lấy tất cả giao dịch (admin)
router.get('/admin/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, userId } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.user = userId;

    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .populate('order', 'orderCode')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Admin get transactions error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách yêu cầu nạp xu pending
router.get('/admin/pending-deposits', adminAuth, async (req, res) => {
  try {
    const deposits = await Transaction.find({ 
      type: 'deposit', 
      status: 'pending' 
    })
      .populate('user', 'name email balance')
      .sort({ createdAt: -1 });

    res.json(deposits);
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác nhận nạp xu (admin)
router.post('/admin/confirm-deposit/:id', adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Giao dịch đã được xử lý' });
    }
    
    if (transaction.type !== 'deposit') {
      return res.status(400).json({ message: 'Không phải giao dịch nạp xu' });
    }

    // Cập nhật số dư user
    const user = await User.findById(transaction.user);
    const oldBalance = user.balance || 0;
    user.balance = oldBalance + transaction.amount;
    await user.save();

    // Cập nhật transaction
    transaction.status = 'completed';
    transaction.balanceBefore = oldBalance;
    transaction.balanceAfter = user.balance;
    transaction.createdBy = req.user._id;
    await transaction.save();

    res.json({
      message: `Đã nạp ${transaction.amount.toLocaleString('vi-VN')}đ cho ${user.name}`,
      transaction,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Từ chối nạp xu (admin)
router.post('/admin/reject-deposit/:id', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Giao dịch đã được xử lý' });
    }

    // Khi từ chối, balanceAfter = balanceBefore (không thay đổi số dư)
    transaction.status = 'cancelled';
    transaction.balanceAfter = transaction.balanceBefore;
    transaction.description += ` - Từ chối: ${reason || 'Không rõ lý do'}`;
    transaction.createdBy = req.user._id;
    await transaction.save();

    res.json({ message: 'Đã từ chối yêu cầu nạp xu', transaction });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cộng/trừ xu thủ công (admin)
router.post('/admin/adjust-balance', adminAuth, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const oldBalance = user.balance || 0;
    const newBalance = oldBalance + amount;
    
    if (newBalance < 0) {
      return res.status(400).json({ message: 'Số dư không thể âm' });
    }

    user.balance = newBalance;
    await user.save();

    // Tạo transaction log
    const transaction = new Transaction({
      user: userId,
      type: 'admin_adjust',
      amount,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      description: description || (amount > 0 ? 'Admin cộng xu' : 'Admin trừ xu'),
      status: 'completed',
      createdBy: req.user._id
    });
    await transaction.save();

    res.json({
      message: amount > 0 
        ? `Đã cộng ${amount.toLocaleString('vi-VN')}đ cho ${user.name}`
        : `Đã trừ ${Math.abs(amount).toLocaleString('vi-VN')}đ của ${user.name}`,
      transaction,
      newBalance
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Tặng xu khuyến mãi cho user (admin)
router.post('/admin/bonus', adminAuth, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Số xu tặng phải lớn hơn 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const oldBalance = user.balance || 0;
    user.balance = oldBalance + amount;
    await user.save();

    const transaction = new Transaction({
      user: userId,
      type: 'bonus',
      amount,
      balanceBefore: oldBalance,
      balanceAfter: user.balance,
      description: description || 'Xu khuyến mãi',
      status: 'completed',
      createdBy: req.user._id
    });
    await transaction.save();

    res.json({
      message: `Đã tặng ${amount.toLocaleString('vi-VN')}đ cho ${user.name}`,
      transaction,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Bonus error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ========================================
// WEBHOOK SECURITY - Verify Sepay signature
// ========================================
const verifySepayWebhook = (req) => {
  const apiKey = process.env.SEPAY_API_KEY;
  
  // Nếu không set API key, cho phép tất cả (development mode)
  if (!apiKey) {
    console.warn('⚠️ SEPAY_API_KEY not set - webhook verification disabled!');
    return true;
  }
  
  // Sepay gửi API key trong header Authorization
  const authHeader = req.headers['authorization'] || req.headers['x-sepay-key'];
  
  if (!authHeader) {
    console.error('❌ Missing authorization header in webhook');
    return false;
  }
  
  // So sánh API key
  const providedKey = authHeader.replace('Bearer ', '').replace('Apikey ', '');
  if (providedKey !== apiKey) {
    console.error('❌ Invalid API key in webhook');
    return false;
  }
  
  return true;
};

// Webhook Sepay cho nạp xu tự động
router.post('/webhook/sepay', async (req, res) => {
  try {
    // ========================================
    // SECURITY: Verify webhook authenticity
    // ========================================
    if (!verifySepayWebhook(req)) {
      console.error('❌ Wallet webhook verification failed');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { content, transferAmount, transferType, id, transactionDate } = req.body;

    console.log('📥 Wallet webhook received:', { content, transferAmount, transferType });

    if (transferType !== 'in') {
      return res.json({ success: true, message: 'Ignored outgoing transaction' });
    }

    // Tìm transaction pending theo content (NAP...)
    const contentUpper = (content || '').toUpperCase();
    
    const pendingDeposit = await Transaction.findOne({
      type: 'deposit',
      status: 'pending',
      'paymentInfo.content': { $regex: new RegExp(contentUpper.match(/NAP[A-Z0-9]+/)?.[0] || 'NOMATCH', 'i') }
    }).populate('user');

    if (!pendingDeposit) {
      console.log('⚠️ No matching deposit found for content:', content);
      return res.json({ success: true, message: 'No matching deposit' });
    }

    // Kiểm tra số tiền
    if (transferAmount < pendingDeposit.amount) {
      console.log('⚠️ Amount mismatch:', { received: transferAmount, expected: pendingDeposit.amount });
      return res.json({ success: true, message: 'Amount mismatch' });
    }

    // Cập nhật số dư
    const user = pendingDeposit.user;
    const oldBalance = user.balance || 0;
    user.balance = oldBalance + pendingDeposit.amount;
    await user.save();

    // Cập nhật transaction
    pendingDeposit.status = 'completed';
    pendingDeposit.balanceBefore = oldBalance;
    pendingDeposit.balanceAfter = user.balance;
    pendingDeposit.paymentInfo.transactionId = id;
    await pendingDeposit.save();

    console.log('✅ Deposit confirmed:', pendingDeposit.paymentInfo.content, 'Amount:', pendingDeposit.amount);

    res.json({ success: true, message: 'Deposit confirmed' });
  } catch (error) {
    console.error('❌ Wallet webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
