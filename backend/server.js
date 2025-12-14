import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import statsRoutes from './routes/stats.js';
import accountRoutes from './routes/accounts.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';
import Account from './models/Account.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS config
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// RATE LIMITING - Chống brute force
// ========================================

// Rate limit cho auth routes (login/register) - 5 requests/15 phút
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // 5 requests
  message: { 
    message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Không đếm request thành công
});

// Rate limit chung cho API - 100 requests/phút
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 100,
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Áp dụng rate limit
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Cleanup expired reservations every 5 minutes
setInterval(async () => {
  try {
    const count = await Account.cleanupExpiredReservations();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired reservations`);
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}, 5 * 60 * 1000);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server running without database. Some features may not work.');
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});
