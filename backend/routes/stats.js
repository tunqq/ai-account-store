import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Account from '../models/Account.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalCategories, totalAccounts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Category.countDocuments(),
      Account.countDocuments()
    ]);
    
    // Tính doanh thu từ đơn hàng đã thanh toán
    const paidOrders = await Order.find({ status: { $in: ['paid', 'completed'] } });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Đơn hàng gần đây
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Sản phẩm bán chạy
    const topProducts = await Product.find()
      .populate('category', 'name')
      .sort({ sold: -1 })
      .limit(5);

    // Thống kê tài khoản
    const accountStats = await Account.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalAccounts,
      totalRevenue,
      recentOrders,
      topProducts,
      accountStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
