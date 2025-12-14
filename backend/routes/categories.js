import express from 'express';
import Category from '../models/Category.js';
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

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get all categories (admin)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create category
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = new Category({
      name, slug, description, isActive: isActive === 'true',
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Update category
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const updateData = { name, description, isActive: isActive === 'true' };
    if (name) updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;
    
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Đếm số products bị ảnh hưởng
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    res.json({ 
      ...category.toObject(), 
      affectedProducts: productCount,
      message: updateData.isActive === false && productCount > 0 
        ? `Danh mục đã ẩn. ${productCount} sản phẩm thuộc danh mục này sẽ không hiển thị cho khách hàng.`
        : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Delete category - kiểm tra có products không
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Kiểm tra có products thuộc category này không
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa danh mục này vì có ${productCount} sản phẩm đang thuộc danh mục. Vui lòng chuyển hoặc xóa các sản phẩm trước.`,
        productCount
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get category stats (admin)
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find();
    const stats = await Promise.all(categories.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat._id });
      const activeProductCount = await Product.countDocuments({ category: cat._id, isActive: true });
      return {
        _id: cat._id,
        name: cat.name,
        isActive: cat.isActive,
        totalProducts: productCount,
        activeProducts: activeProductCount
      };
    }));
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
