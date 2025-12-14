import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wallet from './pages/Wallet';
import Guide from './pages/Guide';
import Warranty from './pages/Warranty';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';

import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import AdminProducts from './admin/Products';
import AdminCategories from './admin/Categories';
import AdminOrders from './admin/Orders';
import AdminUsers from './admin/Users';
import AdminAccounts from './admin/Accounts';
import AdminWallet from './admin/Wallet';
import AdminSettings from './admin/Settings';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" />
      <Routes>
        {/* Auth pages - no header/footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Main pages with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="guide" element={<Guide />} />
          <Route path="warranty" element={<Warranty />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="terms" element={<Terms />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
