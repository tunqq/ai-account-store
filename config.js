/**
 * ========================================
 * AI STORE - CONFIGURATION FILE
 * ========================================
 * 
 * File cấu hình chính cho toàn bộ ứng dụng.
 * Chỉnh sửa các giá trị bên dưới để tùy chỉnh theo nhu cầu.
 */

export const config = {
  // ========================================
  // THÔNG TIN CỬA HÀNG
  // ========================================
  store: {
    name: 'AI Store',
    tagline: 'Premium Accounts',
    description: 'Cửa hàng tài khoản AI Premium uy tín',
    logo: 'AI', // Text hiển thị trong logo
    email: 'support@aistore.vn',
    phone: '0123 456 789',
    address: 'Hà Nội, Việt Nam',
    
    // Social links
    social: {
      facebook: 'https://facebook.com/aistore',
      telegram: 'https://t.me/aistore',
      zalo: 'https://zalo.me/aistore',
    },
  },

  // ========================================
  // TÀI KHOẢN ADMIN MẶC ĐỊNH
  // ========================================
  admin: {
    name: 'Admin',
    email: 'admin@aistore.vn',
    password: 'admin123',
  },

  // ========================================
  // TÀI KHOẢN TEST
  // ========================================
  testUser: {
    name: 'Test User',
    email: 'user@test.com',
    password: 'user123',
  },

  // ========================================
  // DEMO ACCOUNTS (Khi không có MongoDB)
  // ========================================
  demoAccounts: {
    admin: {
      id: 'demo-admin-001',
      name: 'Admin Demo',
      email: 'admin@aistore.vn',
      role: 'admin',
    },
    user: {
      id: 'demo-user-001',
      name: 'User Demo',
      email: 'user@demo.com',
      role: 'user',
    },
  },

  // ========================================
  // THANH TOÁN - VIETQR
  // ========================================
  payment: {
    bankId: '970422',           // Mã ngân hàng (MB Bank)
    accountNo: '0123456789',    // Số tài khoản
    accountName: 'AI STORE',    // Tên chủ tài khoản
    
    // Danh sách ngân hàng phổ biến:
    // 970422 - MB Bank
    // 970415 - VietinBank
    // 970436 - Vietcombank
    // 970418 - BIDV
    // 970407 - Techcombank
    // 970423 - TPBank
    // 970432 - VPBank
    // 970403 - Sacombank
  },

  // ========================================
  // CÀI ĐẶT CHUNG
  // ========================================
  settings: {
    currency: 'VND',
    currencySymbol: 'đ',
    locale: 'vi-VN',
    
    // Warranty (ngày)
    warrantyDays: 30,
    
    // Pagination
    productsPerPage: 12,
    ordersPerPage: 10,
    
    // Order status
    orderStatuses: {
      pending: { label: 'Chờ thanh toán', color: 'yellow' },
      paid: { label: 'Đã thanh toán', color: 'blue' },
      completed: { label: 'Hoàn thành', color: 'green' },
      cancelled: { label: 'Đã hủy', color: 'red' },
    },
  },

  // ========================================
  // DANH MỤC SẢN PHẨM
  // ========================================
  categories: [
    { 
      id: 'chatgpt',
      name: 'ChatGPT', 
      slug: 'chatgpt',
      icon: 'GPT',
      color: 'from-green-500 to-emerald-600',
      description: 'Tài khoản ChatGPT Plus, Team'
    },
    { 
      id: 'claude',
      name: 'Claude', 
      slug: 'claude',
      icon: 'CL',
      color: 'from-orange-500 to-amber-600',
      description: 'Tài khoản Claude Pro, Team'
    },
    { 
      id: 'midjourney',
      name: 'Midjourney', 
      slug: 'midjourney',
      icon: 'MJ',
      color: 'from-blue-500 to-indigo-600',
      description: 'Tài khoản Midjourney Premium'
    },
    { 
      id: 'gemini',
      name: 'Gemini', 
      slug: 'gemini',
      icon: 'GE',
      color: 'from-purple-500 to-violet-600',
      description: 'Tài khoản Google Gemini Advanced'
    },
    { 
      id: 'copilot',
      name: 'Copilot', 
      slug: 'copilot',
      icon: 'CP',
      color: 'from-pink-500 to-rose-600',
      description: 'Tài khoản GitHub Copilot'
    },
  ],

  // ========================================
  // THỐNG KÊ HIỂN THỊ (Hero section)
  // ========================================
  stats: {
    customers: '10K+',
    orders: '50K+',
    satisfaction: '99%',
  },

  // ========================================
  // API ENDPOINTS
  // ========================================
  api: {
    baseUrl: import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
  },
};

// Helper functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat(config.settings.locale).format(price) + config.settings.currencySymbol;
};

export const getOrderStatusInfo = (status) => {
  return config.settings.orderStatuses[status] || { label: status, color: 'gray' };
};

export default config;
