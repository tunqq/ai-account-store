import express from 'express';
import Product from '../models/Product.js';
import { adminAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get all products (public - chỉ lấy products có category active)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    // Lấy products và populate category
    let products = await Product.find(query).populate('category').sort({ createdAt: -1 });
    
    // Lọc chỉ giữ products có category active (hoặc không có category)
    products = products.filter(p => !p.category || p.category.isActive === true);
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get single product (public - kiểm tra cả product và category active)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    
    // Kiểm tra product active và category active
    if (!product.isActive) {
      return res.status(404).json({ message: 'Sản phẩm không khả dụng' });
    }
    if (product.category && !product.category.isActive) {
      return res.status(404).json({ message: 'Sản phẩm thuộc danh mục đã ẩn' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get all products (admin) - bao gồm cả thông tin category.isActive
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name slug isActive') // Lấy cả isActive của category
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create product (stock được quản lý tự động qua Accounts)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, features, isActive, isFeatured, defaultExpiryDays, defaultWarrantyDays } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const product = new Product({
      name, slug, description, price: Number(price), originalPrice: Number(originalPrice) || null,
      category, features: features ? JSON.parse(features) : [], 
      stock: 0, // Stock được tính tự động từ Accounts
      isActive: isActive === 'true', isFeatured: isFeatured === 'true',
      defaultExpiryDays: Number(defaultExpiryDays) || 0,
      defaultWarrantyDays: Number(defaultWarrantyDays) || 0,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Update product (không cập nhật stock vì được quản lý qua Accounts)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, features, isActive, isFeatured, defaultExpiryDays, defaultWarrantyDays } = req.body;
    const updateData = {
      name, description, price: Number(price), originalPrice: Number(originalPrice) || null,
      category,
      isActive: isActive === 'true', isFeatured: isFeatured === 'true',
      defaultExpiryDays: Number(defaultExpiryDays) || 0,
      defaultWarrantyDays: Number(defaultWarrantyDays) || 0
      // Không cập nhật stock - được quản lý tự động qua Accounts
    };
    if (features) updateData.features = JSON.parse(features);
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
