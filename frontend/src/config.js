/**
 * ========================================
 * AI STORE - FRONTEND CONFIGURATION
 * ========================================
 * 
 * File cấu hình cho frontend.
 * Chỉnh sửa các giá trị bên dưới để tùy chỉnh giao diện và thông tin.
 */

const config = {
  // ========================================
  // THÔNG TIN CỬA HÀNG
  // ========================================
  store: {
    name: 'AI Store',
    tagline: 'Premium Accounts',
    description: 'Cửa hàng tài khoản AI Premium uy tín',
    logo: 'AI',
    email: 'support@aistore.vn',
    phone: '0123 456 789',
    address: 'Hà Nội, Việt Nam',
    
    social: {
      facebook: 'https://facebook.com/aistore',
      telegram: 'https://t.me/aistore',
      zalo: 'https://zalo.me/aistore',
    },
  },

  // ========================================
  // DEMO ACCOUNTS (Khi không có MongoDB)
  // ========================================
  demoAccounts: {
    admin: {
      id: 'demo-admin-001',
      name: 'Admin Demo',
      email: 'admin@aistore.vn',
      password: 'admin123', // Chỉ hiển thị trong trang Login
      role: 'admin',
    },
    user: {
      id: 'demo-user-001',
      name: 'User Demo',
      email: 'user@demo.com',
      password: 'user123',
      role: 'user',
    },
  },

  // ========================================
  // THỐNG KÊ HIỂN THỊ (Hero section)
  // ========================================
  stats: {
    customers: '10K+',
    orders: '50K+',
    satisfaction: '99%',
  },

  // ========================================
  // CÀI ĐẶT CHUNG
  // ========================================
  settings: {
    currency: 'VND',
    currencySymbol: 'đ',
    locale: 'vi-VN',
    warrantyDays: 30,
    productsPerPage: 12,
    
    orderStatuses: {
      pending: { label: 'Chờ thanh toán', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
      paid: { label: 'Đã thanh toán', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700' },
      completed: { label: 'Hoàn thành', color: 'green', bg: 'bg-green-100', text: 'text-green-700' },
      cancelled: { label: 'Đã hủy', color: 'red', bg: 'bg-red-100', text: 'text-red-700' },
    },
  },

  // ========================================
  // API
  // ========================================
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export const formatPrice = (price) => {
  return new Intl.NumberFormat(config.settings.locale).format(price) + config.settings.currencySymbol;
};

export const getOrderStatus = (status) => {
  return config.settings.orderStatuses[status] || { 
    label: status, 
    color: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700'
  };
};

export default config;
