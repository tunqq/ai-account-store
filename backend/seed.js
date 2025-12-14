import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';

dotenv.config();

// ========================================
// CẤU HÌNH TÀI KHOẢN - Chỉnh sửa tại đây hoặc trong .env
// ========================================
const CONFIG = {
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@aistore.vn',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  testUser: {
    name: process.env.TEST_USER_NAME || 'Test User',
    email: process.env.TEST_USER_EMAIL || 'user@test.com',
    password: process.env.TEST_USER_PASSWORD || 'user123',
  },
};

const seedData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: CONFIG.admin.name,
      email: CONFIG.admin.email,
      password: CONFIG.admin.password,
      role: 'admin'
    });

    // Create test user
    await User.create({
      name: CONFIG.testUser.name,
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password,
      role: 'user'
    });

    // Create categories
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'ChatGPT', slug: 'chatgpt', description: 'Tài khoản ChatGPT Plus, Team', isActive: true },
      { name: 'Claude', slug: 'claude', description: 'Tài khoản Claude Pro, Team', isActive: true },
      { name: 'Midjourney', slug: 'midjourney', description: 'Tài khoản Midjourney Premium', isActive: true },
      { name: 'Gemini', slug: 'gemini', description: 'Tài khoản Google Gemini Advanced', isActive: true },
      { name: 'Copilot', slug: 'copilot', description: 'Tài khoản GitHub Copilot', isActive: true }
    ]);

    // Create products
    console.log('📦 Creating products...');
    await Product.insertMany([
      {
        name: 'ChatGPT Plus 1 Tháng',
        slug: 'chatgpt-plus-1-thang',
        description: 'Tài khoản ChatGPT Plus chính chủ, sử dụng 1 tháng với đầy đủ tính năng GPT-4o, DALL-E 3, GPTs và nhiều hơn nữa.',
        price: 250000,
        originalPrice: 500000,
        category: categories[0]._id,
        features: ['GPT-4o & GPT-4 Turbo', 'DALL-E 3 tạo ảnh', 'Browsing Internet', 'Code Interpreter', 'Custom GPTs', 'Voice Chat'],
        accountData: 'Email: demo@example.com | Pass: demo123',
        stock: 50,
        sold: 1250,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'ChatGPT Plus 3 Tháng',
        slug: 'chatgpt-plus-3-thang',
        description: 'Gói 3 tháng tiết kiệm hơn, đầy đủ tính năng ChatGPT Plus premium.',
        price: 650000,
        originalPrice: 1500000,
        category: categories[0]._id,
        features: ['GPT-4o & GPT-4 Turbo', 'DALL-E 3', 'Tiết kiệm 15%', '3 tháng sử dụng'],
        accountData: 'Email: demo@example.com | Pass: demo123',
        stock: 30,
        sold: 856,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Claude Pro 1 Tháng',
        slug: 'claude-pro-1-thang',
        description: 'Tài khoản Claude Pro với Claude 3.5 Sonnet - AI mạnh nhất hiện tại cho coding và phân tích.',
        price: 350000,
        originalPrice: 500000,
        category: categories[1]._id,
        features: ['Claude 3.5 Sonnet', 'Claude 3 Opus', '5x more usage', 'Priority access', 'Projects feature'],
        accountData: 'Email: claude@example.com | Pass: claude123',
        stock: 35,
        sold: 967,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Midjourney Standard 1 Tháng',
        slug: 'midjourney-standard-1-thang',
        description: 'Tài khoản Midjourney Standard với 15 giờ GPU/tháng, tạo ảnh AI chất lượng cao.',
        price: 300000,
        originalPrice: 450000,
        category: categories[2]._id,
        features: ['15 giờ GPU Fast', 'Midjourney V6.1', 'Stealth mode', 'Relax unlimited', 'Commercial license'],
        accountData: 'Discord: mj@example.com | Pass: mj123',
        stock: 40,
        sold: 1089,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Gemini Advanced 1 Tháng',
        slug: 'gemini-advanced-1-thang',
        description: 'Tài khoản Google Gemini Advanced với Gemini 1.5 Pro, 1M context window.',
        price: 280000,
        originalPrice: 400000,
        category: categories[3]._id,
        features: ['Gemini 1.5 Pro', '1M context window', '2TB Google One', 'Multimodal', 'Google Workspace'],
        accountData: 'Email: gemini@example.com | Pass: gemini123',
        stock: 45,
        sold: 756,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'GitHub Copilot 1 Tháng',
        slug: 'github-copilot-1-thang',
        description: 'Tài khoản GitHub Copilot Individual - AI coding assistant tốt nhất cho developer.',
        price: 200000,
        originalPrice: 300000,
        category: categories[4]._id,
        features: ['Code completion', 'Copilot Chat', 'Mọi IDE hỗ trợ', 'Unlimited suggestions', 'Multi-language'],
        accountData: 'GitHub: copilot@example.com | Pass: copilot123',
        stock: 60,
        sold: 1456,
        isActive: true,
        isFeatured: true
      }
    ]);

    console.log('\n========================================');
    console.log('✅ Seed data completed successfully!');
    console.log('========================================');
    console.log('\n📋 Test Accounts:');
    console.log(`   Admin: ${CONFIG.admin.email} / ${CONFIG.admin.password}`);
    console.log(`   User:  ${CONFIG.testUser.email} / ${CONFIG.testUser.password}`);
    console.log('\n💡 Tip: Chỉnh sửa tài khoản trong file .env hoặc seed.js');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();
