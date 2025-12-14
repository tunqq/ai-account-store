import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiArrowUpRight, FiLoader, FiKey } from 'react-icons/fi';
import api from '../utils/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalAccounts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/stats/dashboard');
      setStats({
        totalRevenue: data.totalRevenue || 0,
        totalOrders: data.totalOrders || 0,
        totalProducts: data.totalProducts || 0,
        totalUsers: data.totalUsers || 0,
        totalAccounts: data.totalAccounts || 0
      });
      setRecentOrders(data.recentOrders || []);
      setTopProducts(data.topProducts || []);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const statCards = [
    { icon: FiDollarSign, label: 'Doanh thu', value: formatPrice(stats.totalRevenue), color: '#10b981', bgColor: 'bg-green-50' },
    { icon: FiShoppingBag, label: 'Đơn hàng', value: stats.totalOrders.toLocaleString(), color: '#3b82f6', bgColor: 'bg-blue-50' },
    { icon: FiPackage, label: 'Sản phẩm', value: stats.totalProducts, color: '#a855f7', bgColor: 'bg-purple-50' },
    { icon: FiUsers, label: 'Người dùng', value: stats.totalUsers.toLocaleString(), color: '#f97316', bgColor: 'bg-orange-50' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    const labels = {
      pending: 'Chờ TT',
      paid: 'Đã TT',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Chào mừng trở lại! 👋</h1>
        <p className="text-white/80 text-sm sm:text-base">Đây là tổng quan hoạt động cửa hàng của bạn.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-0.5 sm:mb-1">{stat.value}</p>
            <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-purple-600 text-xs sm:text-sm font-medium hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-slate-500 text-sm">Chưa có đơn hàng nào</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="font-mono text-xs sm:text-sm font-medium text-slate-800">{order.orderCode}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-600 truncate">{order.user?.name || 'Khách'}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate">{order.items?.[0]?.name || 'N/A'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-purple-600 text-sm">{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Sản phẩm bán chạy</h2>
            <Link to="/admin/products" className="text-purple-600 text-xs sm:text-sm font-medium hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-slate-500 text-sm">Chưa có sản phẩm nào</div>
            ) : (
              topProducts.map((product, i) => (
                <div key={product._id} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors flex items-center gap-2 sm:gap-4">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-slate-300'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                        <span className="text-white font-bold text-sm">{product.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate text-sm">{product.name}</p>
                    <p className="text-xs text-slate-500 truncate">{product.category?.name || 'N/A'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-800 text-sm">{(product.sold || 0).toLocaleString()}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">đã bán</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        <h2 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Thao tác nhanh</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
          <Link to="/admin/products" className="p-3 sm:p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center">
            <FiPackage className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Sản phẩm</span>
          </Link>
          <Link to="/admin/accounts" className="p-3 sm:p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors text-center">
            <FiKey className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 mx-auto mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Tài khoản</span>
          </Link>
          <Link to="/admin/categories" className="p-3 sm:p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
            <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Danh mục</span>
          </Link>
          <Link to="/admin/orders" className="p-3 sm:p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center">
            <FiShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Đơn hàng</span>
          </Link>
          <Link to="/admin/users" className="p-3 sm:p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center">
            <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Người dùng</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
