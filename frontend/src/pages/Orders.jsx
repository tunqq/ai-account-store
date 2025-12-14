import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPackage, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiLoader } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/my-orders');
      // Chỉ hiện đơn hàng thành công (paid, completed), không hiện đơn hủy
      const successOrders = data.filter(order => 
        order.status === 'paid' || order.status === 'completed'
      );
      setOrders(successOrders);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FiClock, label: 'Chờ TT' },
      paid: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FiCheckCircle, label: 'Đã TT' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheckCircle, label: 'Hoàn thành' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: FiXCircle, label: 'Đã hủy' }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Chưa có đơn hàng</h1>
          <p className="text-slate-500 text-sm mb-6">Bạn chưa có đơn hàng nào</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg transition-all text-sm"
          >
            Mua sắm ngay
            <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Đơn hàng của tôi</h1>

        <div className="space-y-3 sm:space-y-4">
          {orders.map(order => (
            <Link 
              key={order._id} 
              to={`/orders/${order._id}`} 
              className="block bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all border-2 border-transparent hover:border-purple-200"
            >
              <div className="flex flex-wrap justify-between items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <p className="font-mono font-bold text-slate-800 text-sm sm:text-lg">{order.orderCode}</p>
                  <p className="text-xs sm:text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="flex flex-wrap justify-between items-center pt-3 sm:pt-4 border-t border-slate-100">
                <div className="text-slate-600 text-sm">
                  <span className="font-medium">{order.items?.length || 0}</span> sản phẩm
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="font-bold text-lg sm:text-xl text-purple-600">{formatPrice(order.totalAmount)}</span>
                  <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
