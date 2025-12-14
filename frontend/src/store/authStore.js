import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      
      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ 
            user: data.user, 
            token: data.token, 
            isAuthenticated: true,
            loading: false 
          });
          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      register: async (name, email, phone, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/auth/register', { name, email, phone, password });
          set({ 
            user: data.user, 
            token: data.token, 
            isAuthenticated: true,
            loading: false 
          });
          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },
      
      checkAuth: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateBalance: (newBalance) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, balance: newBalance } });
        }
      },

      // Demo login (fallback khi không có backend)
      // Cấu hình tài khoản demo trong file config.js
      demoLogin: (role = 'user') => {
        const demoAccounts = {
          admin: { 
            id: 'demo-admin-001', 
            name: 'Admin Demo', 
            email: 'admin@aistore.vn', 
            role: 'admin' 
          },
          user: { 
            id: 'demo-user-001', 
            name: 'User Demo', 
            email: 'user@demo.com', 
            role: 'user' 
          },
        };
        const demoUser = demoAccounts[role] || demoAccounts.user;
        set({ user: demoUser, token: 'demo-token', isAuthenticated: true });
      }
    }),
    { name: 'auth-storage' }
  )
);

export default useAuthStore;
