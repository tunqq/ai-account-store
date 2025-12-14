import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// PASSWORD VALIDATION - Kiểm tra độ mạnh mật khẩu
// ========================================
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 số');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// EMAIL VALIDATION
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// PHONE VALIDATION - Bắt buộc, đúng đầu số Việt Nam
const validatePhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s/g, '');
  
  // Đầu số Việt Nam hợp lệ (10 số):
  // Viettel: 03x (032-039), 09x (096, 097, 098, 086)
  // Vinaphone: 08x (081-085, 088), 09x (091, 094)
  // Mobifone: 07x (070, 076-079), 09x (090, 093)
  // Vietnamobile: 05x (052, 056, 058), 092
  // Gmobile: 059, 099
  // Itelecom: 087
  const phoneRegex = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])[0-9]{7}$/;
  return phoneRegex.test(cleanPhone);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }
    
    // Validate phone - BẮT BUỘC
    if (!phone) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng đầu số VN (VD: 0912345678)' });
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Mật khẩu không đủ mạnh',
        errors: passwordValidation.errors
      });
    }
    
    // Validate name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    const user = new User({ 
      name: name.trim(), 
      email: email.toLowerCase(), 
      phone: phone ? phone.replace(/\s/g, '') : '',
      password 
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra tài khoản có bị khóa không
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, balance: user.balance } });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, balance: req.user.balance } });
});

// Get all users (admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Toggle user status (admin) - Khóa/Mở khóa tài khoản
router.put('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Không cho phép khóa admin
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không thể khóa tài khoản admin' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ 
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      user: { ...user.toObject(), password: undefined }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Delete user (admin)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Không cho phép xóa admin
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không thể xóa tài khoản admin' });
    }
    
    await user.deleteOne();
    res.json({ message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Update user role (admin)
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ message: 'Đã cập nhật vai trò', user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Get user details with orders and accounts (admin)
router.get('/users/:id/details', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Import models
    const Order = (await import('../models/Order.js')).default;
    const Account = (await import('../models/Account.js')).default;
    
    // Lấy đơn hàng của user
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Lấy tài khoản đã mua
    const accounts = await Account.find({ soldTo: user._id, status: 'sold' })
      .populate('product', 'name image')
      .sort({ soldAt: -1 });
    
    // Kiểm tra tài khoản hết hạn
    const now = new Date();
    const expiredAccounts = accounts.filter(acc => acc.expiryDate && new Date(acc.expiryDate) < now);
    const expiringSoonAccounts = accounts.filter(acc => {
      if (!acc.expiryDate) return false;
      const expiry = new Date(acc.expiryDate);
      const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    });
    
    // Thống kê
    const totalSpent = orders
      .filter(o => o.status === 'paid' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    res.json({
      user,
      orders,
      accounts: accounts.map(acc => ({
        _id: acc._id,
        product: acc.product,
        credentials: acc.getDecryptedCredentials(),
        soldAt: acc.soldAt,
        soldPrice: acc.soldPrice,
        expiryDate: acc.expiryDate,
        warrantyExpires: acc.warrantyExpires,
        isExpired: acc.expiryDate ? new Date(acc.expiryDate) < now : false,
        isExpiringSoon: acc.expiryDate ? (() => {
          const diffDays = Math.ceil((new Date(acc.expiryDate) - now) / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= 7;
        })() : false
      })),
      stats: {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'paid' || o.status === 'completed').length,
        totalAccounts: accounts.length,
        expiredAccounts: expiredAccounts.length,
        expiringSoonAccounts: expiringSoonAccounts.length,
        totalSpent
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Reset password (admin)
router.post('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Mật khẩu không đủ mạnh',
        errors: passwordValidation.errors
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: `Đã đặt lại mật khẩu cho ${user.name}` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
