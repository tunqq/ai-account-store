import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Clear orders
router.delete('/clear/orders', adminAuth, async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({ message: `Đã xóa ${result.deletedCount} đơn hàng` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Clear accounts (inventory)
router.delete('/clear/accounts', adminAuth, async (req, res) => {
  try {
    const result = await Account.deleteMany({});
    // Reset stock của tất cả products về 0
    await Product.updateMany({}, { stock: 0 });
    res.json({ message: `Đã xóa ${result.deletedCount} tài khoản trong kho` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Clear products (and related accounts)
router.delete('/clear/products', adminAuth, async (req, res) => {
  try {
    const accountResult = await Account.deleteMany({});
    const productResult = await Product.deleteMany({});
    res.json({ 
      message: `Đã xóa ${productResult.deletedCount} sản phẩm và ${accountResult.deletedCount} tài khoản` 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Clear categories
router.delete('/clear/categories', adminAuth, async (req, res) => {
  try {
    const result = await Category.deleteMany({});
    res.json({ message: `Đã xóa ${result.deletedCount} danh mục` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Clear users (except admin)
router.delete('/clear/users', adminAuth, async (req, res) => {
  try {
    const result = await User.deleteMany({ role: { $ne: 'admin' } });
    res.json({ message: `Đã xóa ${result.deletedCount} người dùng` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Clear transactions
router.delete('/clear/transactions', adminAuth, async (req, res) => {
  try {
    const result = await Transaction.deleteMany({});
    // Reset balance của tất cả users về 0 (trừ admin)
    await User.updateMany({ role: { $ne: 'admin' } }, { balance: 0 });
    res.json({ message: `Đã xóa ${result.deletedCount} giao dịch và reset số dư` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Clear ALL data (keep admin)
router.delete('/clear/all', adminAuth, async (req, res) => {
  try {
    const results = {
      orders: (await Order.deleteMany({})).deletedCount,
      accounts: (await Account.deleteMany({})).deletedCount,
      products: (await Product.deleteMany({})).deletedCount,
      categories: (await Category.deleteMany({})).deletedCount,
      transactions: (await Transaction.deleteMany({})).deletedCount,
      users: (await User.deleteMany({ role: { $ne: 'admin' } })).deletedCount,
    };
    
    res.json({ 
      message: `Đã xóa toàn bộ dữ liệu: ${results.orders} đơn hàng, ${results.products} sản phẩm, ${results.accounts} tài khoản, ${results.categories} danh mục, ${results.transactions} giao dịch, ${results.users} người dùng`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
