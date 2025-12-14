import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    
    // Kiểm tra tài khoản có bị khóa không
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.',
        code: 'ACCOUNT_LOCKED'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Không có quyền truy cập' });
  }
};

// Optional auth - không bắt buộc đăng nhập, nhưng nếu có token thì parse user
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Token không hợp lệ thì bỏ qua, tiếp tục như guest
    next();
  }
};
