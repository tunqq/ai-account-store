import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiCopy, FiCheck, FiClock, FiCheckCircle, FiXCircle, FiArrowLeft, FiLoader } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated, navigate]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (error) {
      toast.error('Không tìm thấy đơn hàng');
      navigate('/orders');
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

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success('Đã sao chép!');
    setTimeout(() => setCopied(''), 2000);
  };

  const getStatusInfo = (status) => {
    const info = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FiClock, label: 'Chờ thanh toán' },
      paid: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FiCheckCircle, label: 'Đã thanh toán' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheckCircle, label: 'Hoàn thành' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: FiXCircle, label: 'Đã hủy' }
    };
    return info[status] || info.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Không tìm thấy đơn hàng</p>
          <Link to="/orders" className="text-purple-600 hover:underline">Quay lại</Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <Link to="/orders" className="inline-flex items-center text-slate-600 hover:text-purple-600 mb-4 sm:mb-6 transition-colors text-sm sm:text-base">
          <FiArrowLeft className="mr-2 w-4 h-4" /> Quay lại
        </Link>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100">
            <div className="flex flex-wrap justify-between items-start gap-2 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 mb-1">Đơn hàng #{order.orderCode}</h1>
                <p className="text-slate-500 text-xs sm:text-base">{formatDate(order.createdAt)}</p>
              </div>
              <span className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-full font-medium text-xs sm:text-base ${statusInfo.bg} ${statusInfo.text}`}>
                <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Products */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Sản phẩm</h2>
            <div className="space-y-3 sm:space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{item.name}</p>
                      <p className="text-xs sm:text-sm text-slate-500">x{item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <span className="font-semibold text-purple-600 text-sm sm:text-base flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  
                  {/* Show account data if paid/completed */}
                  {(order.status === 'paid' || order.status === 'completed') && item.accountData && (
                    <div className="mt-3 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs sm:text-sm font-medium text-green-700">🔐 Thông tin tài khoản:</p>
                        <button 
                          onClick={() => copyToClipboard(item.accountData, `acc-${i}`)}
                          className="text-green-600 hover:text-green-800 p-1"
                        >
                          {copied === `acc-${i}` ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="text-xs sm:text-sm text-green-800 whitespace-pre-wrap font-mono bg-white p-2 rounded overflow-x-auto">
                        {item.accountData}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
              <span className="font-semibold text-slate-800 text-sm sm:text-base">Tổng cộng</span>
              <span className="text-xl sm:text-2xl font-bold text-purple-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Info (only show if pending) */}
          {order.status === 'pending' && order.paymentInfo && (
            <div className="p-4 sm:p-6 md:p-8">
              <h2 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Thông tin thanh toán</h2>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <img 
                  src={order.paymentInfo.qrUrl} 
                  alt="VietQR" 
                  className="mx-auto rounded-xl shadow-lg mb-4 sm:mb-6 w-48 sm:max-w-[250px]" 
                />
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-white rounded-xl">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Ngân hàng</p>
                      <p className="font-semibold text-slate-800 text-sm sm:text-base">MB Bank</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-white rounded-xl">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-slate-500">Số tài khoản</p>
                      <p className="font-mono font-semibold text-slate-800 text-sm sm:text-base truncate">{order.paymentInfo.accountNo}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(order.paymentInfo.accountNo, 'account')} 
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copied === 'account' ? <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-white rounded-xl">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-500">Số tiền</p>
                      <p className="font-bold text-lg sm:text-xl text-purple-600">{formatPrice(order.totalAmount)}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(order.totalAmount.toString(), 'amount')} 
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copied === 'amount' ? <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-purple-600">Nội dung CK</p>
                      <p className="font-mono font-bold text-purple-700 text-sm sm:text-base truncate">{order.paymentInfo.content}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(order.paymentInfo.content, 'content')} 
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copied === 'content' ? <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Vui lòng chuyển khoản đúng số tiền và nội dung.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {(order.status === 'paid' || order.status === 'completed') && (
            <div className="p-4 sm:p-6 md:p-8 bg-green-50">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1 text-sm sm:text-base">
                    {order.status === 'completed' ? 'Đơn hàng đã hoàn thành!' : 'Đã thanh toán thành công!'}
                  </h3>
                  <p className="text-green-700 text-xs sm:text-sm">
                    Thông tin tài khoản đã được hiển thị ở trên. Vui lòng đổi mật khẩu ngay.
                  </p>
                  {order.paidAt && (
                    <p className="text-green-600 text-[10px] sm:text-xs mt-2">
                      Thanh toán lúc: {formatDate(order.paidAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cancelled Message */}
          {order.status === 'cancelled' && (
            <div className="p-4 sm:p-6 md:p-8 bg-red-50">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiXCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1 text-sm sm:text-base">Đơn hàng đã bị hủy</h3>
                  <p className="text-red-700 text-xs sm:text-sm">
                    Đơn hàng này đã bị hủy. Nếu bạn đã thanh toán, vui lòng liên hệ hỗ trợ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
