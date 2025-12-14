import axios from 'axios';

// API base URL - sử dụng env variable trong production
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000 // 10 seconds timeout
});

// Request interceptor - thêm token vào header
api.interceptors.request.use((config) => {
  const storage = localStorage.getItem('auth-storage');
  if (storage) {
    try {
      const { state } = JSON.parse(storage);
      if (state?.token && state.token !== 'demo-token') {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (e) {
      console.error('Error parsing auth storage:', e);
    }
  }
  return config;
});

// Response interceptor - xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      // Chỉ redirect nếu không phải trang login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Xử lý lỗi 403 - Tài khoản bị khóa
    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_LOCKED') {
      localStorage.removeItem('auth-storage');
      // Hiển thị thông báo và redirect về login
      alert('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.');
      window.location.href = '/login';
    }
    
    // Xử lý lỗi network
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
