import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMinus, faPlus, faShieldHalved, faClock, faStar, faSpinner, faBolt, faXmark, faCopy, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../store/authStore';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Cấu hình VietQR
const VIETQR_CONFIG = {
  bankId: '970422',
  accountNo: '0123456789',
  accountName: 'AI STORE',
  template: 'compact2'
};

const getSessionId = () => {
  let sessionId = localStorage.getItem('purchase_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(-8);
    localStorage.setItem('purchase_session_id', sessionId);
  }
  return sessionId;
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [orderCode, setOrderCode] = useState('');
  const [reservedAccounts, setReservedAccounts] = useState([]);
  const [purchasedAccounts, setPurchasedAccounts] = useState([]);
  const [expireTime, setExpireTime] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('vietqr'); // 'vietqr' or 'balance'
  const [processingBalance, setProcessingBalance] = useState(false);
  const pollingRef = useRef(null);
  const { user, isAuthenticated, updateBalance } = useAuthStore();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        if (data.category?._id) {
          const relatedRes = await api.get(`/products?category=${data.category._id}`);
          setRelatedProducts(relatedRes.data.filter(p => p._id !== id).slice(0, 4));
        }
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  // Countdown timer
  useEffect(() => {
    if (!expireTime) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expireTime) - new Date()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (paymentStatus === 'waiting') {
          setPaymentStatus('error');
          setErrorMessage('Hết thời gian chờ thanh toán. Vui lòng thử lại.');
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expireTime, paymentStatus]);

  const generateOrderCode = () => 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  const formatCountdown = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  // Polling để check trạng thái thanh toán (cho Sepay webhook)
  const startPolling = (orderId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        if (data.status === 'paid' || data.status === 'completed') {
          clearInterval(pollingRef.current);
          // Lấy thông tin tài khoản từ order
          if (data.items?.[0]?.accountData) {
            setPurchasedAccounts([{ credentials: data.items[0].accountData }]);
          }
          setPaymentStatus('success');
          toast.success('Thanh toán thành công!', { icon: '🎉' });
          const { data: updatedProduct } = await api.get(`/products/${id}`);
          setProduct(updatedProduct);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Check mỗi 5 giây
  };

  // Mua ngay - Tạo order pending và hiện QR
  const handleBuyNow = async () => {
    if (!product || product.stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    if (quantity > product.stock) {
      toast.error(`Chỉ còn ${product.stock} tài khoản`);
      return;
    }

    setShowPaymentModal(true);
    setPaymentStatus('creating');
    setErrorMessage('');
    setPurchasedAccounts([]);
    setEmail(user?.email || '');

    try {
      const newOrderCode = generateOrderCode();
      setOrderCode(newOrderCode);

      // Tạo order pending qua API
      const { data } = await api.post('/orders/quick-buy', {
        productId: product._id,
        quantity,
        email: user?.email || '',
        orderCode: newOrderCode
      });

      if (data.order) {
        setCreatedOrderId(data.order._id);
        // Sử dụng thời gian từ server nếu có
        const expireAt = data.reserveExpires ? new Date(data.reserveExpires) : new Date(Date.now() + 15 * 60 * 1000);
        setExpireTime(expireAt);
        setPaymentStatus('waiting');
        // Bắt đầu polling để check thanh toán
        startPolling(data.order._id);
        // Refresh product để cập nhật stock (vì tài khoản đã bị reserve)
        const { data: updatedProduct } = await api.get(`/products/${id}`);
        setProduct(updatedProduct);
      } else {
        throw new Error('Không thể tạo đơn hàng');
      }
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
      toast.error(error.response?.data?.message || 'Không thể tạo đơn hàng');
    }
  };

  const handleCloseModal = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    // Nếu đang chờ thanh toán, hủy order và trả lại tài khoản
    if (paymentStatus === 'waiting' && createdOrderId) {
      try {
        await api.post(`/orders/${createdOrderId}/cancel`);
        // Refresh product để cập nhật stock (tài khoản đã được trả lại)
        const { data: updatedProduct } = await api.get(`/products/${id}`);
        setProduct(updatedProduct);
      } catch (error) {
        console.error('Cancel order error:', error);
      }
    }
    setShowPaymentModal(false);
    setPaymentStatus('idle');
    setCreatedOrderId(null);
    setExpireTime(null);
  };

  const getVietQRUrl = () => {
    const amount = product.price * quantity;
    return `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(VIETQR_CONFIG.accountName)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Không tìm thấy sản phẩm</h1>
          <Link to="/products" className="text-purple-600 hover:underline">Quay lại</Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs sm:text-sm mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="text-slate-500 hover:text-purple-600 flex-shrink-0">Trang chủ</Link>
          <span className="text-slate-300 flex-shrink-0">/</span>
          <Link to="/products" className="text-slate-500 hover:text-purple-600 flex-shrink-0">Sản phẩm</Link>
          <span className="text-slate-300 flex-shrink-0">/</span>
          <span className="text-slate-800 font-medium truncate max-w-[150px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* Product Detail */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-12">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 aspect-square lg:aspect-auto">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-8xl font-bold text-white/50">{product.name.charAt(0)}</span>
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-6 left-6 bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">-{discount}%</span>
              )}
            </div>

            {/* Info */}
            <div className="p-5 sm:p-8 lg:p-12">
              {product.category && (
                <Link to={`/products?category=${product.category._id}`} className="inline-block text-xs sm:text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full mb-3 sm:mb-4">
                  {product.category.name}
                </Link>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">{product.name}</h1>

              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => <FontAwesomeIcon key={i} icon={faStar} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />)}
                  <span className="ml-2 text-slate-600 text-sm sm:text-base">5.0</span>
                </div>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <span className="text-slate-600 text-sm sm:text-base">{product.sold?.toLocaleString() || 0} đã bán</span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <span className="text-2xl sm:text-4xl font-bold text-purple-600">{formatPrice(product.price)}</span>
                {product.originalPrice && <span className="text-base sm:text-xl text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>}
              </div>

              <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">{product.description}</p>

              {product.features?.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Tính năng:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {product.features.map((f, i) => (
                      <div key={i} className="flex items-center text-slate-600">
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Buttons */}
              <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center border border-slate-200 rounded-xl">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 sm:p-4 hover:bg-slate-100">
                      <FontAwesomeIcon icon={faMinus} className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="px-4 sm:px-6 font-semibold text-base sm:text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 sm:p-4 hover:bg-slate-100">
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <span className="text-slate-500 text-sm sm:text-base">Tổng: <span className="font-bold text-purple-600">{formatPrice(product.price * quantity)}</span></span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button onClick={handleBuyNow} disabled={product.stock <= 0}
                    className="py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center text-sm sm:text-base">
                    <FontAwesomeIcon icon={faBolt} className="mr-2 w-4 h-4" />
                    {product.stock <= 0 ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                  <a 
                    href="https://zalo.me/0352772640" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl hover:shadow-lg flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <span className="hidden sm:inline">Liên hệ </span>Zalo
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-slate-600 text-sm sm:text-base">{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-xs sm:text-sm">Bảo hành 30 ngày</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Đổi mới nếu lỗi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-xs sm:text-sm">Giao hàng tức thì</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Nhận ngay sau thanh toán</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {paymentStatus === 'success' ? '🎉 Thanh toán thành công!' : 
                 paymentStatus === 'error' ? '❌ Có lỗi xảy ra' : '💳 Thanh toán'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-xl">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Creating State */}
              {paymentStatus === 'creating' && (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faSpinner} className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-slate-600">Đang tạo đơn hàng...</p>
                </div>
              )}

              {/* Error State */}
              {paymentStatus === 'error' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faXmark} className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-600 mb-4">{errorMessage}</p>
                  <button onClick={handleCloseModal} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
                    Đóng
                  </button>
                </div>
              )}

              {/* Waiting for Payment */}
              {paymentStatus === 'waiting' && (
                <>
                  {/* Countdown */}
                  <div className="bg-orange-50 rounded-xl p-3 mb-4 flex items-center justify-between border border-orange-200">
                    <span className="text-orange-700 text-sm">⏱️ Thời gian thanh toán:</span>
                    <span className={`font-bold text-lg ${countdown < 60 ? 'text-red-600' : 'text-orange-600'}`}>
                      {formatCountdown(countdown)}
                    </span>
                  </div>

                  {/* Order Info */}
                  <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-14 h-14 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <span className="text-white font-bold">{product.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 text-sm">{product.name}</h3>
                        <p className="text-sm text-slate-500">Số lượng: <span className="font-bold text-purple-600">{quantity}</span></p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <span className="text-slate-600 text-sm">Tổng thanh toán:</span>
                      <span className="text-xl font-bold text-purple-600">{formatPrice(product.price * quantity)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Chọn phương thức thanh toán:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('vietqr')}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === 'vietqr'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-medium text-slate-800 text-sm">🏦 VietQR</p>
                        <p className="text-xs text-slate-500">Chuyển khoản</p>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('balance')}
                        disabled={!isAuthenticated}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === 'balance'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <p className="font-medium text-slate-800 text-sm">💰 Số dư xu</p>
                        <p className="text-xs text-slate-500">
                          {isAuthenticated ? `${(user?.balance || 0).toLocaleString('vi-VN')}đ` : 'Cần đăng nhập'}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Balance Payment */}
                  {paymentMethod === 'balance' && isAuthenticated && (
                    <div className="mb-4">
                      {(user?.balance || 0) >= product.price * quantity ? (
                        <button
                          onClick={async () => {
                            if (processingBalance) return;
                            setProcessingBalance(true);
                            try {
                              const { data } = await api.post(`/orders/${createdOrderId}/pay-with-balance`);
                              if (pollingRef.current) clearInterval(pollingRef.current);
                              setPurchasedAccounts(data.accounts?.map(a => ({ credentials: a.accountData })) || []);
                              updateBalance(data.newBalance);
                              setPaymentStatus('success');
                              toast.success('Thanh toán thành công!', { icon: '🎉' });
                            } catch (error) {
                              toast.error(error.response?.data?.message || 'Thanh toán thất bại');
                            } finally {
                              setProcessingBalance(false);
                            }
                          }}
                          disabled={processingBalance}
                          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {processingBalance ? (
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                          ) : (
                            <>💰 Thanh toán {formatPrice(product.price * quantity)} bằng xu</>
                          )}
                        </button>
                      ) : (
                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                          <p className="text-red-700 text-sm">
                            ❌ Số dư không đủ. Cần {formatPrice(product.price * quantity)}, hiện có {formatPrice(user?.balance || 0)}
                          </p>
                          <Link to="/wallet" className="text-purple-600 text-sm font-medium hover:underline mt-2 inline-block">
                            → Nạp thêm xu
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VietQR Payment */}
                  {paymentMethod === 'vietqr' && (
                    <>
                      {/* QR Code */}
                      <div className="text-center mb-4">
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 inline-block">
                          <img src={getVietQRUrl()} alt="VietQR" className="w-52 h-52 mx-auto" />
                        </div>
                      </div>

                      {/* Bank Info */}
                      <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-600">Ngân hàng:</span>
                            <span className="font-medium text-blue-800">MB Bank</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-600">Số TK:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-800">{VIETQR_CONFIG.accountNo}</span>
                              <button onClick={() => copyToClipboard(VIETQR_CONFIG.accountNo)} className="text-blue-500">
                                <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-600">Số tiền:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-800">{formatPrice(product.price * quantity)}</span>
                              <button onClick={() => copyToClipboard((product.price * quantity).toString())} className="text-blue-500">
                                <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-600">Nội dung:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-800">{orderCode}</span>
                              <button onClick={() => copyToClipboard(orderCode)} className="text-blue-500">
                                <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Waiting message */}
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 text-green-600 animate-spin" />
                          <div>
                            <p className="font-medium text-green-800">Đang chờ thanh toán...</p>
                            <p className="text-sm text-green-600">Hệ thống sẽ tự động xác nhận khi nhận được tiền</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Reserved notice */}
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-purple-700">
                      🔒 <strong>{quantity} tài khoản</strong> đã được giữ cho bạn trong <strong>{formatCountdown(countdown)}</strong>. 
                      Không ai khác có thể mua trong thời gian này.
                    </p>
                  </div>
                </>
              )}

              {/* Success State */}
              {paymentStatus === 'success' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Cảm ơn bạn đã mua hàng!</h3>
                    <p className="text-slate-500">Đơn hàng: {orderCode}</p>
                  </div>

                  {purchasedAccounts.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-4 border border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-3">🔐 Thông tin tài khoản</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {purchasedAccounts.map((acc, index) => (
                          <div key={index} className="bg-white rounded-xl p-3 border border-purple-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-medium text-purple-600">Tài khoản #{index + 1}</span>
                              <button onClick={() => copyToClipboard(acc.credentials)} className="text-purple-500 text-xs flex items-center gap-1">
                                <FontAwesomeIcon icon={faCopy} className="w-3 h-3" /> Copy
                              </button>
                            </div>
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-2 rounded">
                              {acc.credentials}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập.</p>
                  </div>

                  <button onClick={handleCloseModal}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg">
                    Đóng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
