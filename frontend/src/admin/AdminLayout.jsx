import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiUsers, FiLogOut, FiMenu, FiX, FiSettings, FiBell, FiKey, FiClock, FiDollarSign } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [depositNotifications, setDepositNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDepositCount, setPendingDepositCount] = useState(0);
  const [readNotifications, setReadNotifications] = useState(() => {
    // Load từ localStorage khi khởi tạo
    const saved = localStorage.getItem('readNotifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const notificationRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch recent orders as notifications
  const fetchNotifications = async () => {
    try {
      // Fetch orders
      const { data } = await api.get('/orders/admin/all?limit=10');
      const orders = data.orders || data || [];
      setNotifications(orders);
      
      // Count paid orders from last 24 hours as "unread" (đơn mua thành công)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentOrders = orders.filter(o => 
        new Date(o.createdAt) > oneDayAgo && 
        (o.status === 'paid' || o.status === 'completed')
      );
      // Trừ đi những thông báo đã đọc
      const unreadOrders = recentOrders.filter(o => !readNotifications.has(o._id));
      
      // Fetch pending deposits
      try {
        const depositRes = await api.get('/wallet/admin/pending-deposits');
        const deposits = depositRes.data || [];
        setDepositNotifications(deposits);
        setPendingDepositCount(deposits.length);
      } catch (err) {
        console.error('Error fetching deposits:', err);
      }
      
      setUnreadCount(unreadOrders.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = (orderId) => {
    setReadNotifications(prev => {
      const newSet = new Set([...prev, orderId]);
      localStorage.setItem('readNotifications', JSON.stringify([...newSet]));
      return newSet;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrderIds = notifications
      .filter(o => 
        new Date(o.createdAt) > oneDayAgo && 
        (o.status === 'paid' || o.status === 'completed')
      )
      .map(o => o._id);
    setReadNotifications(prev => {
      const newSet = new Set([...prev, ...recentOrderIds]);
      localStorage.setItem('readNotifications', JSON.stringify([...newSet]));
      return newSet;
    });
    setUnreadCount(0);
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchNotifications();
      // Poll for new orders every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: FiPackage, label: 'Sản phẩm' },
    { path: '/admin/categories', icon: FiGrid, label: 'Danh mục' },
    { path: '/admin/accounts', icon: FiKey, label: 'Tài khoản' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Đơn hàng' },
    { path: '/admin/wallet', icon: FiDollarSign, label: 'Ví xu' },
    { path: '/admin/users', icon: FiUsers, label: 'Người dùng' },
    { path: '/admin/settings', icon: FiSettings, label: 'Cài đặt' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-600';
      case 'paid': return 'bg-blue-100 text-blue-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    } catch {
      return '';
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/admin" className="flex items-center">
          <img src="/1.png" alt="AI-ZONE SHOP" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile Notification */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-100 rounded-xl relative"
            >
              <FiBell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl">
            {sidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 flex flex-col`}>
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <Link to="/admin" className="flex items-center justify-center">
              <img src="/1.png" alt="AI-ZONE SHOP" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path, item.exact)
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.path === '/admin/orders' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {item.path === '/admin/wallet' && pendingDepositCount > 0 && (
                  <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingDepositCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-slate-100">
            <Link 
              to="/" 
              className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all mb-2"
            >
              <FiHome className="w-5 h-5" />
              <span className="font-medium">Về trang chủ</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all w-full"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 min-h-screen">
          {/* Top Bar */}
          <div className="bg-white shadow-sm p-4 lg:p-6 sticky top-0 z-30 hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500">Quản lý cửa hàng của bạn</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-slate-100 rounded-xl relative"
                >
                  <FiBell className="w-5 h-5 text-slate-600" />
                  {(unreadCount + pendingDepositCount) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {(unreadCount + pendingDepositCount) > 9 ? '9+' : (unreadCount + pendingDepositCount)}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <FiBell className="w-4 h-4" />
                        Thông báo
                      </h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              markAllAsRead();
                            }}
                            className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full transition-colors"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {/* Pending Deposits Section */}
                      {depositNotifications.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
                            <p className="text-xs font-semibold text-green-700">💰 Yêu cầu nạp xu ({depositNotifications.length})</p>
                          </div>
                          {depositNotifications.slice(0, 3).map((deposit) => (
                            <Link
                              key={deposit._id}
                              to="/admin/wallet"
                              onClick={() => setShowNotifications(false)}
                              className="block p-4 hover:bg-green-50 border-b border-slate-50 transition-colors bg-green-50/50"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-500">
                                  <FiDollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-slate-900 truncate">
                                      {deposit.user?.name || 'Người dùng'}
                                    </p>
                                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                                      Chờ duyệt
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-500">
                                    Nạp {new Intl.NumberFormat('vi-VN').format(deposit.amount)}đ
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-green-600 font-medium">
                                      {deposit.paymentInfo?.content}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <FiClock className="w-3 h-3" />
                                      {formatTime(deposit.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {depositNotifications.length > 3 && (
                            <Link
                              to="/admin/wallet"
                              onClick={() => setShowNotifications(false)}
                              className="block p-2 text-center text-green-600 hover:bg-green-50 text-xs font-medium"
                            >
                              Xem thêm {depositNotifications.length - 3} yêu cầu →
                            </Link>
                          )}
                        </>
                      )}

                      {/* Orders Section */}
                      {notifications.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
                            <p className="text-xs font-semibold text-purple-700">🛒 Đơn hàng gần đây ({notifications.length})</p>
                          </div>
                          {notifications.map((order) => {
                            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                            const isRecent = new Date(order.createdAt) > oneDayAgo;
                            const isPaid = order.status === 'paid' || order.status === 'completed';
                            const isUnread = isRecent && isPaid && !readNotifications.has(order._id);
                            
                            return (
                              <Link
                                key={order._id}
                                to="/admin/orders"
                                onClick={() => {
                                  if (isUnread) markAsRead(order._id);
                                  setShowNotifications(false);
                                }}
                                className={`block p-4 hover:bg-slate-50 border-b border-slate-50 transition-colors ${
                                  isUnread ? 'bg-purple-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isUnread 
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                      : 'bg-slate-200'
                                  }`}>
                                    <FiShoppingBag className={`w-5 h-5 ${isUnread ? 'text-white' : 'text-slate-500'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className={`font-semibold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                        {isPaid && isRecent ? '🎉 ' : ''}{order.user?.name || 'Khách hàng'}
                                      </p>
                                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">
                                      {order.items?.[0]?.name || order.product?.name || 'Sản phẩm'}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-sm font-bold text-purple-600">
                                        {new Intl.NumberFormat('vi-VN').format(order.totalAmount || 0)}đ
                                      </span>
                                      <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <FiClock className="w-3 h-3" />
                                        {formatTime(order.createdAt)}
                                        {isUnread && <span className="w-2 h-2 bg-purple-500 rounded-full ml-1"></span>}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </>
                      )}

                      {notifications.length === 0 && depositNotifications.length === 0 && (
                        <div className="p-8 text-center">
                          <FiBell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">Chưa có thông báo nào</p>
                        </div>
                      )}
                    </div>

                    <div className="flex border-t border-slate-100">
                      <Link
                        to="/admin/orders"
                        onClick={() => setShowNotifications(false)}
                        className="flex-1 p-3 text-center text-purple-600 hover:bg-purple-50 font-medium text-sm"
                      >
                        Đơn hàng
                      </Link>
                      <Link
                        to="/admin/wallet"
                        onClick={() => setShowNotifications(false)}
                        className="flex-1 p-3 text-center text-green-600 hover:bg-green-50 font-medium text-sm border-l border-slate-100"
                      >
                        Ví xu
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button className="p-2 hover:bg-slate-100 rounded-xl">
                <FiSettings className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
