import express from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Account from '../models/Account.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { auth, adminAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

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

// ========================================
// SEPAY WEBHOOK - Tự động xác nhận thanh toán
// ========================================
router.post('/webhook/sepay', async (req, res) => {
  try {
    // ========================================
    // SECURITY: Verify webhook authenticity
    // ========================================
    if (!verifySepayWebhook(req)) {
      console.error('❌ Webhook verification failed');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { 
      id,
      gateway,
      transactionDate,
      accountNumber,
      code,
      content,
      transferType,
      transferAmount,
      accumulated,
      subAccount,
      referenceCode,
      description
    } = req.body;

    console.log('📥 Sepay webhook received:', { id, content, transferAmount, transferType });

    // Chỉ xử lý giao dịch tiền vào
    if (transferType !== 'in') {
      return res.json({ success: true, message: 'Ignored outgoing transaction' });
    }

    // Tìm order theo nội dung chuyển khoản (orderCode)
    // Content có thể chứa orderCode ở nhiều format khác nhau
    const contentUpper = (content || '').toUpperCase();
    
    // Tìm tất cả orders pending và match với content
    const pendingOrders = await Order.find({ status: 'pending' });
    
    let matchedOrder = null;
    for (const order of pendingOrders) {
      if (contentUpper.includes(order.orderCode.toUpperCase())) {
        matchedOrder = order;
        break;
      }
    }

    if (!matchedOrder) {
      console.log('⚠️ No matching order found for content:', content);
      return res.json({ success: true, message: 'No matching order' });
    }

    // Kiểm tra số tiền
    if (transferAmount < matchedOrder.totalAmount) {
      console.log('⚠️ Amount mismatch:', { received: transferAmount, expected: matchedOrder.totalAmount });
      return res.json({ success: true, message: 'Amount mismatch' });
    }

    console.log('✅ Matched order:', matchedOrder.orderCode);

    // Cập nhật trạng thái đơn hàng - sử dụng tài khoản đã reserved
    for (const item of matchedOrder.items) {
      // Ưu tiên sử dụng tài khoản đã reserved
      let accountIds = item.reservedAccountIds || [];
      
      // Nếu không có reserved accounts (đơn cũ), lấy từ available
      if (accountIds.length === 0) {
        const accounts = await Account.find({
          product: item.product,
          status: 'available'
        }).limit(item.quantity);

        if (accounts.length < item.quantity) {
          console.error('❌ Not enough accounts for product:', item.name);
          continue;
        }
        accountIds = accounts.map(a => a._id);
      }

      // Confirm purchase - chuyển từ reserved/available sang sold
      const confirmResult = await Account.confirmPurchase(
        accountIds,
        matchedOrder._id,
        matchedOrder.user,
        matchedOrder.guestEmail,
        item.price
      );

      if (confirmResult.success) {
        // Lưu thông tin tài khoản vào order
        item.accountData = confirmResult.accounts.map(a => a.credentials).join('\n---\n');
      } else {
        // Fallback: lấy từ available nếu reserved đã hết hạn
        const accounts = await Account.find({
          product: item.product,
          status: 'available'
        }).limit(item.quantity);

        if (accounts.length >= item.quantity) {
          const fallbackIds = accounts.map(a => a._id);
          await Account.updateMany(
            { _id: { $in: fallbackIds } },
            {
              $set: {
                status: 'sold',
                soldTo: matchedOrder.user,
                order: matchedOrder._id,
                soldAt: new Date(),
                soldPrice: item.price
              }
            }
          );
          item.accountData = accounts.map(a => a.getDecryptedCredentials()).join('\n---\n');
        } else {
          console.error('❌ Not enough accounts for product:', item.name);
          continue;
        }
      }

      // Cập nhật số lượng đã bán
      await Product.findByIdAndUpdate(item.product, {
        $inc: { sold: item.quantity }
      });
      
      const availableCount = await Account.countAvailable(item.product);
      await Product.findByIdAndUpdate(item.product, { stock: availableCount });
    }

    matchedOrder.status = 'paid';
    matchedOrder.paidAt = new Date();
    matchedOrder.paymentInfo.transactionId = id;
    matchedOrder.paymentInfo.transactionDate = transactionDate;
    await matchedOrder.save();

    console.log('✅ Order paid:', matchedOrder.orderCode);
    
    res.json({ success: true, message: 'Payment confirmed', orderCode: matchedOrder.orderCode });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate order code
const generateOrderCode = () => {
  return 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
};

// Generate VietQR URL
const generateVietQR = (amount, orderCode) => {
  const bankId = process.env.VIETQR_BANK_ID || '970422';
  const accountNo = process.env.VIETQR_ACCOUNT_NO || '0123456789';
  const accountName = process.env.VIETQR_ACCOUNT_NAME || 'AI STORE';
  const content = `${orderCode}`;
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
};

// ========================================
// ADMIN ROUTES (đặt trước để không bị match với /:id)
// ========================================

// Get all orders (admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Update order status (admin)
router.put('/admin/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const oldStatus = order.status;

    // Xử lý khi chuyển sang trạng thái paid
    if (status === 'paid' && oldStatus === 'pending') {
      for (const item of order.items) {
        // Ưu tiên sử dụng tài khoản đã reserved
        let accountIds = item.reservedAccountIds || [];
        let accounts = [];
        
        if (accountIds.length > 0) {
          // Confirm purchase từ reserved accounts
          const confirmResult = await Account.confirmPurchase(
            accountIds,
            order._id,
            order.user,
            order.guestEmail,
            item.price
          );
          
          if (confirmResult.success) {
            item.accountData = confirmResult.accounts.map(a => a.credentials).join('\n---\n');
          } else {
            // Reserved đã hết hạn, lấy từ available
            accounts = await Account.find({
              product: item.product,
              status: 'available'
            }).limit(item.quantity);
            
            if (accounts.length < item.quantity) {
              return res.status(400).json({
                message: `Không đủ tài khoản cho sản phẩm ${item.name}. Còn ${accounts.length}/${item.quantity}`
              });
            }
            
            accountIds = accounts.map(a => a._id);
            await Account.updateMany(
              { _id: { $in: accountIds } },
              {
                $set: {
                  status: 'sold',
                  soldTo: order.user,
                  order: order._id,
                  soldAt: new Date(),
                  soldPrice: item.price
                }
              }
            );
            
            item.accountData = accounts.map(a => a.getDecryptedCredentials()).join('\n---\n');
          }
        } else {
          // Không có reserved, lấy từ available
          accounts = await Account.find({
            product: item.product,
            status: 'available'
          }).limit(item.quantity);

          if (accounts.length < item.quantity) {
            return res.status(400).json({
              message: `Không đủ tài khoản cho sản phẩm ${item.name}. Còn ${accounts.length}/${item.quantity}`
            });
          }

          accountIds = accounts.map(a => a._id);
          await Account.updateMany(
            { _id: { $in: accountIds } },
            {
              $set: {
                status: 'sold',
                soldTo: order.user,
                order: order._id,
                soldAt: new Date(),
                soldPrice: item.price
              }
            }
          );

          item.accountData = accounts.map(a => a.getDecryptedCredentials()).join('\n---\n');
        }

        await Product.findByIdAndUpdate(item.product, {
          $inc: { sold: item.quantity }
        });
        
        const availableCount = await Account.countAvailable(item.product);
        await Product.findByIdAndUpdate(item.product, { stock: availableCount });
      }

      order.paidAt = new Date();
    }

    // Xử lý khi hủy đơn đã thanh toán
    if (status === 'cancelled' && oldStatus === 'paid') {
      // Trả lại tài khoản về kho
      for (const item of order.items) {
        await Account.updateMany(
          { order: order._id, product: item.product },
          {
            $set: {
              status: 'available',
              soldTo: null,
              order: null,
              soldAt: null,
              soldPrice: null
            }
          }
        );

        const availableCount = await Account.countAvailable(item.product);
        await Product.findByIdAndUpdate(item.product, {
          stock: availableCount,
          $inc: { sold: -item.quantity }
        });
      }
      
      // ========================================
      // REFUND: Hoàn xu nếu thanh toán bằng balance
      // ========================================
      if (order.paymentMethod === 'balance' && order.user) {
        const user = await User.findById(order.user);
        if (user) {
          const oldBalance = user.balance || 0;
          user.balance = oldBalance + order.totalAmount;
          await user.save();
          
          // Tạo transaction log hoàn xu
          const refundTransaction = new Transaction({
            user: user._id,
            type: 'refund',
            amount: order.totalAmount,
            balanceBefore: oldBalance,
            balanceAfter: user.balance,
            description: `Hoàn xu đơn hàng ${order.orderCode} (Admin hủy)`,
            order: order._id,
            status: 'completed',
            createdBy: req.user._id
          });
          await refundTransaction.save();
          
          console.log(`💰 Refunded ${order.totalAmount} to ${user.email} for order ${order.orderCode}`);
        }
      }
    }

    order.status = status;
    await order.save();
    await order.populate('user', 'name email');
    
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Auto complete orders (admin cron)
router.post('/admin/auto-complete', adminAuth, async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await Order.updateMany(
      { status: 'paid', paidAt: { $lt: oneDayAgo } },
      { $set: { status: 'completed' } }
    );

    res.json({ 
      message: `Đã hoàn thành ${result.modifiedCount} đơn hàng`,
      count: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ========================================
// USER ROUTES
// ========================================

// Quick buy - Mua ngay 1 sản phẩm (không cần đăng nhập)
// Sẽ reserve tài khoản trong 15 phút
router.post('/quick-buy', optionalAuth, async (req, res) => {
  try {
    const { productId, quantity, email, orderCode } = req.body;
    const RESERVE_MINUTES = 15;
    
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Thiếu thông tin sản phẩm' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Tạo session ID để track reservation
    const sessionId = req.user?._id?.toString() || `guest_${Date.now()}_${Math.random().toString(36).slice(-8)}`;

    // Reserve tài khoản (chuyển sang trạng thái "reserved")
    const reserveResult = await Account.reserveAccounts(productId, quantity, sessionId, RESERVE_MINUTES);
    
    if (!reserveResult.success) {
      return res.status(400).json({ 
        message: `Chỉ còn ${reserveResult.available} tài khoản khả dụng`,
        available: reserveResult.available
      });
    }

    const totalAmount = product.price * quantity;
    const newOrderCode = orderCode || generateOrderCode();

    const order = new Order({
      orderCode: newOrderCode,
      user: req.user?._id || null,
      guestEmail: email || null,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        reservedAccountIds: reserveResult.accountIds
      }],
      totalAmount,
      status: 'pending',
      reserveExpires: reserveResult.expireTime,
      paymentInfo: {
        qrUrl: generateVietQR(totalAmount, newOrderCode),
        bankId: process.env.VIETQR_BANK_ID || '970422',
        accountNo: process.env.VIETQR_ACCOUNT_NO || '0123456789',
        accountName: process.env.VIETQR_ACCOUNT_NAME || 'AI STORE',
        content: newOrderCode
      }
    });

    await order.save();
    
    // Cập nhật stock hiển thị (available count)
    const availableCount = await Account.countAvailable(productId);
    await Product.findByIdAndUpdate(productId, { stock: availableCount });

    console.log(`✅ Order ${newOrderCode} created with ${quantity} reserved accounts, expires at ${reserveResult.expireTime}`);
    
    res.status(201).json({ 
      order,
      reserveExpires: reserveResult.expireTime
    });
  } catch (error) {
    console.error('Quick buy error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Thanh toán bằng xu (balance) - Yêu cầu đăng nhập
router.post('/:id/pay-with-balance', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra quyền sở hữu
    if (order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền thanh toán đơn hàng này' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn hàng đã được xử lý' });
    }

    // Kiểm tra số dư
    const user = await User.findById(req.user._id);
    if (user.balance < order.totalAmount) {
      return res.status(400).json({ 
        message: `Số dư không đủ. Cần ${order.totalAmount.toLocaleString('vi-VN')}đ, hiện có ${user.balance.toLocaleString('vi-VN')}đ`,
        required: order.totalAmount,
        balance: user.balance
      });
    }

    // Trừ xu
    const oldBalance = user.balance;
    user.balance -= order.totalAmount;
    await user.save();

    // Tạo transaction log
    const transaction = new Transaction({
      user: user._id,
      type: 'purchase',
      amount: -order.totalAmount,
      balanceBefore: oldBalance,
      balanceAfter: user.balance,
      description: `Thanh toán đơn hàng ${order.orderCode}`,
      order: order._id,
      status: 'completed'
    });
    await transaction.save();

    // Xử lý tài khoản - chuyển từ reserved sang sold
    for (const item of order.items) {
      let accountIds = item.reservedAccountIds || [];
      
      if (accountIds.length > 0) {
        const confirmResult = await Account.confirmPurchase(
          accountIds,
          order._id,
          user._id,
          user.email,
          item.price
        );
        
        if (confirmResult.success) {
          item.accountData = confirmResult.accounts.map(a => a.credentials).join('\n---\n');
        } else {
          // Fallback nếu reserved hết hạn
          const accounts = await Account.find({
            product: item.product,
            status: 'available'
          }).limit(item.quantity);
          
          if (accounts.length < item.quantity) {
            // Hoàn xu nếu không đủ tài khoản
            user.balance = oldBalance;
            await user.save();
            await Transaction.findByIdAndDelete(transaction._id);
            return res.status(400).json({
              message: `Không đủ tài khoản cho sản phẩm ${item.name}`
            });
          }
          
          accountIds = accounts.map(a => a._id);
          await Account.updateMany(
            { _id: { $in: accountIds } },
            {
              $set: {
                status: 'sold',
                soldTo: user._id,
                order: order._id,
                soldAt: new Date(),
                soldPrice: item.price
              }
            }
          );
          item.accountData = accounts.map(a => a.getDecryptedCredentials()).join('\n---\n');
        }
      } else {
        // Không có reserved, lấy từ available
        const accounts = await Account.find({
          product: item.product,
          status: 'available'
        }).limit(item.quantity);

        if (accounts.length < item.quantity) {
          user.balance = oldBalance;
          await user.save();
          await Transaction.findByIdAndDelete(transaction._id);
          return res.status(400).json({
            message: `Không đủ tài khoản cho sản phẩm ${item.name}`
          });
        }

        accountIds = accounts.map(a => a._id);
        await Account.updateMany(
          { _id: { $in: accountIds } },
          {
            $set: {
              status: 'sold',
              soldTo: user._id,
              order: order._id,
              soldAt: new Date(),
              soldPrice: item.price
            }
          }
        );
        item.accountData = accounts.map(a => a.getDecryptedCredentials()).join('\n---\n');
      }

      // Cập nhật stock và sold
      await Product.findByIdAndUpdate(item.product, {
        $inc: { sold: item.quantity }
      });
      const availableCount = await Account.countAvailable(item.product);
      await Product.findByIdAndUpdate(item.product, { stock: availableCount });
    }

    // Cập nhật order
    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentMethod = 'balance';
    order.user = user._id; // Gán user nếu chưa có
    await order.save();

    console.log(`✅ Order ${order.orderCode} paid with balance by ${user.email}`);

    res.json({
      message: 'Thanh toán thành công!',
      order,
      newBalance: user.balance,
      accounts: order.items.map(item => ({
        product: item.name,
        accountData: item.accountData
      }))
    });
  } catch (error) {
    console.error('Pay with balance error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Cancel order (user hủy đơn pending) - Trả lại tài khoản đã reserve
router.post('/:id/cancel', optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang chờ thanh toán' });
    }

    // Release tất cả tài khoản đã reserve
    for (const item of order.items) {
      if (item.reservedAccountIds && item.reservedAccountIds.length > 0) {
        await Account.releaseReserved(item.reservedAccountIds);
        
        // Cập nhật lại stock
        const availableCount = await Account.countAvailable(item.product);
        await Product.findByIdAndUpdate(item.product, { stock: availableCount });
      }
    }

    order.status = 'cancelled';
    await order.save();
    
    console.log(`🚫 Order ${order.orderCode} cancelled, accounts released`);
    res.json({ message: 'Đã hủy đơn hàng' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create order from cart
router.post('/', auth, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Sản phẩm không tồn tại` });
      }
      
      const availableCount = await Account.countAvailable(product._id);
      if (availableCount < item.quantity) {
        return res.status(400).json({ 
          message: `${product.name} chỉ còn ${availableCount} tài khoản` 
        });
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
    }

    const orderCode = generateOrderCode();
    const order = new Order({
      orderCode,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: 'pending',
      paymentInfo: {
        qrUrl: generateVietQR(totalAmount, orderCode),
        bankId: process.env.VIETQR_BANK_ID || '970422',
        accountNo: process.env.VIETQR_ACCOUNT_NO || '0123456789',
        accountName: process.env.VIETQR_ACCOUNT_NAME || 'AI STORE',
        content: orderCode
      }
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Get user orders (bao gồm cả đơn theo email nếu user đăng nhập)
router.get('/my-orders', auth, async (req, res) => {
  try {
    // Tìm đơn hàng theo user ID hoặc theo email của user
    const orders = await Order.find({
      $or: [
        { user: req.user._id },
        { guestEmail: req.user.email }
      ]
    })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get single order - Yêu cầu đăng nhập hoặc biết orderCode
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image price')
      .populate('user', 'name email');
      
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // ========================================
    // SECURITY: Kiểm tra quyền xem đơn hàng
    // ========================================
    const isOwner = req.user && order.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Guest chỉ được xem nếu:
    // 1. Đơn hàng vừa tạo (pending) - để hiển thị QR thanh toán
    // 2. Hoặc biết orderCode (truyền qua query param)
    const orderCodeFromQuery = req.query.code;
    const isValidGuestAccess = !order.user && (
      order.status === 'pending' || 
      (orderCodeFromQuery && orderCodeFromQuery === order.orderCode)
    );
    
    if (!isOwner && !isAdmin && !isValidGuestAccess) {
      return res.status(403).json({ message: 'Không có quyền xem đơn hàng này' });
    }
    
    // Ẩn thông tin nhạy cảm nếu không phải owner/admin
    if (!isOwner && !isAdmin) {
      // Ẩn accountData cho guest (chỉ hiện khi đã thanh toán và biết orderCode)
      if (order.status !== 'paid' && order.status !== 'completed') {
        order.items.forEach(item => {
          item.accountData = undefined;
        });
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
