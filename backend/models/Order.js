import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, default: null },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    accountData: String,
    reservedAccountIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }]
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentMethod: { type: String, default: 'vietqr' },
  paymentInfo: { type: Object },
  reserveExpires: { type: Date, default: null }, // Thời gian hết hạn giữ chỗ
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date }
});

export default mongoose.model('Order', orderSchema);
