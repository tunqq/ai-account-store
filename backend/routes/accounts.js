import express from 'express';
import mongoose from 'mongoose';
import Account from '../models/Account.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { adminAuth, auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// ADMIN ROUTES
// ========================================

// Lấy tất cả tài khoản của sản phẩm (Admin)
router.get('/product/:productId', adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.query;
    
    const query = { product: productId };
    if (status) query.status = status;
    
    const accounts = await Account.find(query)
      .populate('soldTo', 'name email')
      .populate('order', 'orderCode')
      .sort({ createdAt: -1 });
    
    // Giải mã credentials cho admin
    const decryptedAccounts = accounts.map(acc => ({
      ...acc.toObject(),
      credentials: acc.getDecryptedCredentials()
    }));
    
    res.json(decryptedAccounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Helper: Tính ngày tự động dựa trên product settings
const calculateDates = (product, inputDates = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let expiryDate = inputDates.expiryDate || null;
  let purchaseDate = inputDates.purchaseDate || today;
  let warrantyExpires = inputDates.warrantyExpires || null;
  
  // Tự động tính ngày hết hạn nếu product có defaultExpiryDays và chưa có expiryDate
  if (!expiryDate && product.defaultExpiryDays > 0) {
    expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + product.defaultExpiryDays);
  }
  
  // Tự động tính ngày hết bảo hành nếu product có defaultWarrantyDays và chưa có warrantyExpires
  if (!warrantyExpires && product.defaultWarrantyDays > 0) {
    warrantyExpires = new Date(today);
    warrantyExpires.setDate(warrantyExpires.getDate() + product.defaultWarrantyDays);
  }
  
  return { expiryDate, purchaseDate, warrantyExpires };
};

// Thêm 1 tài khoản (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { productId, credentials, note, expiryDate, purchaseDate, warrantyExpires } = req.body;
    
    if (!productId || !credentials) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Kiểm tra product tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Tính ngày tự động
    const dates = calculateDates(product, { expiryDate, purchaseDate, warrantyExpires });
    
    const account = new Account({
      product: productId,
      credentials,
      note: note || '',
      expiryDate: dates.expiryDate,
      purchaseDate: dates.purchaseDate,
      warrantyExpires: dates.warrantyExpires,
      status: 'available'
    });
    
    await account.save();
    
    // Cập nhật stock của product
    const availableCount = await Account.countAvailable(productId);
    await Product.findByIdAndUpdate(productId, { stock: availableCount });
    
    res.status(201).json({
      message: 'Thêm tài khoản thành công',
      account: {
        ...account.toObject(),
        credentials: account.getDecryptedCredentials()
      }
    });
  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Thêm nhiều tài khoản (Admin) - Bulk import
router.post('/bulk', adminAuth, async (req, res) => {
  try {
    const { productId, accounts } = req.body;
    
    if (!productId || !accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
    
    // Kiểm tra product tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Validate và tạo accounts với tự động tính date
    const accountDocs = accounts.map(acc => {
      const dates = calculateDates(product, {
        expiryDate: acc.expiryDate,
        purchaseDate: acc.purchaseDate,
        warrantyExpires: acc.warrantyExpires
      });
      
      return {
        product: productId,
        credentials: acc.credentials || acc,
        note: acc.note || '',
        expiryDate: dates.expiryDate,
        purchaseDate: dates.purchaseDate,
        warrantyExpires: dates.warrantyExpires,
        status: 'available'
      };
    });
    
    const created = await Account.insertMany(accountDocs);
    
    // Cập nhật stock
    const availableCount = await Account.countAvailable(productId);
    await Product.findByIdAndUpdate(productId, { stock: availableCount });
    
    res.status(201).json({
      message: `Đã thêm ${created.length} tài khoản`,
      count: created.length,
      stock: availableCount
    });
  } catch (error) {
    console.error('Bulk add accounts error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Sửa tài khoản (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { credentials, note, status, expiryDate, purchaseDate, warrantyExpires } = req.body;
    
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }
    
    // Không cho sửa tài khoản đã bán
    if (account.status === 'sold' && status !== 'sold') {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái tài khoản đã bán' });
    }
    
    if (credentials) account.credentials = credentials;
    if (note !== undefined) account.note = note;
    if (expiryDate !== undefined) account.expiryDate = expiryDate || null;
    if (purchaseDate !== undefined) account.purchaseDate = purchaseDate || null;
    if (warrantyExpires !== undefined) account.warrantyExpires = warrantyExpires || null;
    if (status && ['available', 'disabled'].includes(status)) {
      account.status = status;
    }
    
    await account.save();
    
    // Cập nhật stock
    const availableCount = await Account.countAvailable(account.product);
    await Product.findByIdAndUpdate(account.product, { stock: availableCount });
    
    res.json({
      message: 'Cập nhật thành công',
      account: {
        ...account.toObject(),
        credentials: account.getDecryptedCredentials()
      }
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Xóa tài khoản (Admin) - Chỉ xóa available/disabled
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }
    
    if (account.status === 'sold') {
      return res.status(400).json({ message: 'Không thể xóa tài khoản đã bán' });
    }
    
    if (account.status === 'reserved') {
      return res.status(400).json({ message: 'Tài khoản đang được giữ chỗ, vui lòng đợi hết hạn' });
    }
    
    const productId = account.product;
    await account.deleteOne();
    
    // Cập nhật stock
    const availableCount = await Account.countAvailable(productId);
    await Product.findByIdAndUpdate(productId, { stock: availableCount });
    
    res.json({ message: 'Đã xóa tài khoản' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Thống kê tài khoản theo sản phẩm (Admin)
router.get('/stats/:productId', adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Nếu productId là 'all' thì lấy thống kê tất cả
    const matchQuery = productId === 'all' 
      ? {} 
      : { product: new mongoose.Types.ObjectId(productId) };
    
    const stats = await Account.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      available: 0,
      reserved: 0,
      sold: 0,
      disabled: 0,
      total: 0
    };
    
    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy tất cả tài khoản (Admin) - cho view "Tất cả sản phẩm"
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const accounts = await Account.find(query)
      .populate('product', 'name image')
      .populate('soldTo', 'name email')
      .populate('order', 'orderCode')
      .sort({ createdAt: -1 })
      .limit(500); // Giới hạn 500 để tránh quá tải
    
    // Giải mã credentials cho admin
    const decryptedAccounts = accounts.map(acc => ({
      ...acc.toObject(),
      credentials: acc.getDecryptedCredentials()
    }));
    
    res.json(decryptedAccounts);
  } catch (error) {
    console.error('Get all accounts error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ========================================
// PUBLIC/USER ROUTES
// ========================================

// Kiểm tra số lượng available (Public)
router.get('/available/:productId', async (req, res) => {
  try {
    const count = await Account.countAvailable(req.params.productId);
    res.json({ available: count });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Reserve tài khoản (Bước 1 của mua hàng)
router.post('/reserve', async (req, res) => {
  try {
    const { productId, quantity, sessionId } = req.body;
    
    if (!productId || !quantity || !sessionId) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ message: 'Số lượng phải từ 1-10' });
    }
    
    // Kiểm tra product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại hoặc đã ngừng bán' });
    }
    
    // Reserve tài khoản
    const result = await Account.reserveAccounts(productId, quantity, sessionId, 15);
    
    if (!result.success) {
      return res.status(400).json({
        message: result.error === 'NOT_ENOUGH_STOCK' 
          ? `Chỉ còn ${result.available} tài khoản, bạn yêu cầu ${result.requested}`
          : 'Không thể giữ chỗ tài khoản',
        ...result
      });
    }
    
    res.json({
      message: 'Đã giữ chỗ thành công',
      ...result,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price
      }
    });
  } catch (error) {
    console.error('Reserve error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Hủy reserve (User hủy đơn)
router.post('/release', async (req, res) => {
  try {
    const { accountIds, sessionId } = req.body;
    
    if (!accountIds || !Array.isArray(accountIds)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
    
    // Chỉ release những tài khoản do session này reserve
    const result = await Account.updateMany(
      {
        _id: { $in: accountIds },
        status: 'reserved',
        reservedBy: sessionId
      },
      {
        $set: {
          status: 'available',
          reservedAt: null,
          reserveExpires: null,
          reservedBy: null
        }
      }
    );
    
    res.json({
      message: 'Đã hủy giữ chỗ',
      released: result.modifiedCount
    });
  } catch (error) {
    console.error('Release error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác nhận thanh toán (Bước 2 - sau khi thanh toán) - Tạo Order
router.post('/confirm-purchase', optionalAuth, async (req, res) => {
  try {
    const { accountIds, sessionId, email, orderCode } = req.body;
    
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin tài khoản' });
    }
    
    if (!email) {
      return res.status(400).json({ message: 'Thiếu email người mua' });
    }
    
    // Kiểm tra tài khoản còn reserved bởi session này không
    const reservedAccounts = await Account.find({
      _id: { $in: accountIds },
      status: 'reserved',
      reservedBy: sessionId
    }).populate('product');
    
    if (reservedAccounts.length !== accountIds.length) {
      return res.status(400).json({
        message: 'Một số tài khoản đã hết thời gian giữ chỗ hoặc không hợp lệ',
        valid: reservedAccounts.length,
        requested: accountIds.length
      });
    }
    
    // Lấy thông tin product
    const product = reservedAccounts[0].product;
    const price = product ? product.price : 0;
    const quantity = accountIds.length;
    const totalAmount = price * quantity;
    
    // Tạo Order mới
    const newOrderCode = orderCode || ('ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase());
    
    const order = new Order({
      orderCode: newOrderCode,
      user: req.user?._id || null,
      guestEmail: email, // Luôn lưu email để dễ tìm kiếm
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        accountData: reservedAccounts.map(a => a.getDecryptedCredentials()).join('\n---\n')
      }],
      totalAmount,
      status: 'paid',
      paidAt: new Date(),
      paymentMethod: 'vietqr'
    });
    
    await order.save();
    
    // Xác nhận mua - cập nhật accounts
    const result = await Account.confirmPurchase(
      accountIds,
      order._id,
      req.user?._id || null,
      email,
      price
    );
    
    if (!result.success) {
      // Rollback order nếu lỗi
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ message: result.message });
    }
    
    // Cập nhật stock và sold của product
    if (product) {
      const availableCount = await Account.countAvailable(product._id);
      await Product.findByIdAndUpdate(product._id, {
        stock: availableCount,
        $inc: { sold: quantity }
      });
    }
    
    res.json({
      message: 'Thanh toán thành công!',
      accounts: result.accounts,
      order: {
        _id: order._id,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount
      }
    });
  } catch (error) {
    console.error('Confirm purchase error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy tài khoản đã mua của user (cần đăng nhập)
router.get('/my-purchases', auth, async (req, res) => {
  try {
    const accounts = await Account.find({
      soldTo: req.user._id,
      status: 'sold'
    })
    .populate('product', 'name image category')
    .populate('order', 'orderCode createdAt')
    .sort({ soldAt: -1 });
    
    const decryptedAccounts = accounts.map(acc => ({
      _id: acc._id,
      product: acc.product,
      order: acc.order,
      credentials: acc.getDecryptedCredentials(),
      note: acc.note,
      soldAt: acc.soldAt,
      soldPrice: acc.soldPrice
    }));
    
    res.json(decryptedAccounts);
  } catch (error) {
    console.error('Get my purchases error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cleanup expired reservations (có thể gọi từ cron job)
router.post('/cleanup', adminAuth, async (req, res) => {
  try {
    const count = await Account.cleanupExpiredReservations();
    res.json({ message: `Đã giải phóng ${count} tài khoản hết hạn giữ chỗ` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
