import mongoose from 'mongoose';
import crypto from 'crypto';

// ========================================
// ENCRYPTION KEY - BẮT BUỘC phải set trong .env
// ========================================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

// Kiểm tra ENCRYPTION_KEY khi khởi động
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY phải được set trong .env và có ít nhất 32 ký tự!');
  console.error('   Ví dụ: ENCRYPTION_KEY=your-super-secret-32-character-key');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // Dừng server trong production nếu không có key
  }
}

// Mã hóa credentials
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Giải mã credentials
function decrypt(text) {
  if (!text) return '';
  // Nếu không có dấu : thì không phải encrypted text
  if (!text.includes(':')) return text;
  try {
    const parts = text.split(':');
    if (parts.length < 2) return text;
    const iv = Buffer.from(parts.shift(), 'hex');
    if (iv.length !== IV_LENGTH) return text; // IV không hợp lệ
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    // Trả về text gốc nếu không giải mã được (có thể là plain text)
    return text;
  }
}

const accountSchema = new mongoose.Schema({
  // Sản phẩm liên kết
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    index: true
  },
  
  // Thông tin đăng nhập (mã hóa)
  credentials: {
    type: String,
    required: [true, 'Credentials is required']
  },
  
  // Ghi chú thêm (không mã hóa)
  note: {
    type: String,
    default: ''
  },
  
  // Ngày hết hạn tài khoản
  expiryDate: {
    type: Date,
    default: null
  },
  
  // Ngày mua tài khoản (từ nguồn)
  purchaseDate: {
    type: Date,
    default: null
  },
  
  // Ngày hết bảo hành
  warrantyExpires: {
    type: Date,
    default: null
  },
  
  // Trạng thái tài khoản
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'disabled'],
    default: 'available',
    index: true
  },
  
  // Thời gian giữ chỗ (reserved)
  reservedAt: {
    type: Date,
    default: null
  },
  
  // Thời gian hết hạn giữ chỗ
  reserveExpires: {
    type: Date,
    default: null
  },
  
  // Session ID của người giữ chỗ
  reservedBy: {
    type: String,
    default: null
  },
  
  // Người mua
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Email người mua (cho guest checkout)
  soldToEmail: {
    type: String,
    default: null
  },
  
  // Đơn hàng liên kết
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  
  // Thời gian bán
  soldAt: {
    type: Date,
    default: null
  },
  
  // Giá bán thực tế (có thể khác giá gốc nếu có giảm giá)
  soldPrice: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Index compound để tìm kiếm nhanh
accountSchema.index({ product: 1, status: 1 });
accountSchema.index({ reserveExpires: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'reserved' } });

// Middleware: Mã hóa credentials trước khi lưu
accountSchema.pre('save', function(next) {
  if (this.isModified('credentials') && this.credentials && !this.credentials.includes(':')) {
    this.credentials = encrypt(this.credentials);
  }
  next();
});

// Method: Giải mã credentials
accountSchema.methods.getDecryptedCredentials = function() {
  return decrypt(this.credentials);
};

// Method: Kiểm tra còn trong thời gian giữ chỗ không
accountSchema.methods.isReserveValid = function() {
  if (this.status !== 'reserved') return false;
  if (!this.reserveExpires) return false;
  return new Date() < this.reserveExpires;
};

// Static: Lấy tài khoản available cho sản phẩm
accountSchema.statics.getAvailableForProduct = async function(productId, limit = 1) {
  return this.find({
    product: productId,
    status: 'available'
  })
  .sort({ createdAt: 1 }) // FIFO - tài khoản cũ nhất trước
  .limit(limit);
};

// Static: Đếm số tài khoản available
accountSchema.statics.countAvailable = async function(productId) {
  return this.countDocuments({
    product: productId,
    status: 'available'
  });
};

// Static: Reserve tài khoản
accountSchema.statics.reserveAccounts = async function(productId, quantity, sessionId, minutes = 15) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Giải phóng các tài khoản đã hết hạn reserve
    await this.updateMany(
      {
        status: 'reserved',
        reserveExpires: { $lt: new Date() }
      },
      {
        $set: {
          status: 'available',
          reservedAt: null,
          reserveExpires: null,
          reservedBy: null
        }
      },
      { session }
    );
    
    // Lấy tài khoản available
    const accounts = await this.find({
      product: productId,
      status: 'available'
    })
    .sort({ createdAt: 1 })
    .limit(quantity)
    .session(session);
    
    if (accounts.length < quantity) {
      await session.abortTransaction();
      return {
        success: false,
        error: 'NOT_ENOUGH_STOCK',
        available: accounts.length,
        requested: quantity
      };
    }
    
    const expireTime = new Date(Date.now() + minutes * 60 * 1000);
    const accountIds = accounts.map(a => a._id);
    
    // Reserve các tài khoản
    await this.updateMany(
      { _id: { $in: accountIds } },
      {
        $set: {
          status: 'reserved',
          reservedAt: new Date(),
          reserveExpires: expireTime,
          reservedBy: sessionId
        }
      },
      { session }
    );
    
    await session.commitTransaction();
    
    return {
      success: true,
      accountIds,
      expireTime,
      quantity: accounts.length
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static: Xác nhận mua (chuyển từ reserved sang sold)
accountSchema.statics.confirmPurchase = async function(accountIds, orderId, userId, userEmail, price) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Kiểm tra tất cả tài khoản còn reserved không
    const accounts = await this.find({
      _id: { $in: accountIds },
      status: 'reserved'
    }).session(session);
    
    if (accounts.length !== accountIds.length) {
      await session.abortTransaction();
      return {
        success: false,
        error: 'ACCOUNTS_EXPIRED',
        message: 'Một số tài khoản đã hết thời gian giữ chỗ'
      };
    }
    
    // Cập nhật sang sold
    await this.updateMany(
      { _id: { $in: accountIds } },
      {
        $set: {
          status: 'sold',
          soldTo: userId || null,
          soldToEmail: userEmail,
          order: orderId,
          soldAt: new Date(),
          soldPrice: price,
          reservedAt: null,
          reserveExpires: null,
          reservedBy: null
        }
      },
      { session }
    );
    
    await session.commitTransaction();
    
    // Lấy thông tin tài khoản đã mua (với credentials giải mã)
    const soldAccounts = await this.find({ _id: { $in: accountIds } });
    
    return {
      success: true,
      accounts: soldAccounts.map(acc => ({
        _id: acc._id,
        credentials: acc.getDecryptedCredentials(),
        note: acc.note
      }))
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static: Hủy reserve (trả lại kho)
accountSchema.statics.releaseReserved = async function(accountIds) {
  return this.updateMany(
    { _id: { $in: accountIds }, status: 'reserved' },
    {
      $set: {
        status: 'available',
        reservedAt: null,
        reserveExpires: null,
        reservedBy: null
      }
    }
  );
};

// Static: Cleanup expired reservations (chạy định kỳ)
accountSchema.statics.cleanupExpiredReservations = async function() {
  const result = await this.updateMany(
    {
      status: 'reserved',
      reserveExpires: { $lt: new Date() }
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
  return result.modifiedCount;
};

const Account = mongoose.model('Account', accountSchema);

export default Account;
