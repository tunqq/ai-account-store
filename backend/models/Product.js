import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String },
  features: [{ type: String }],
  accountData: { type: String }, // Thông tin tài khoản (email, password, etc.)
  stock: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  // Số ngày hết hạn mặc định cho tài khoản (0 = không tự động tính)
  defaultExpiryDays: { type: Number, default: 0 },
  // Số ngày bảo hành mặc định (0 = không bảo hành)
  defaultWarrantyDays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
