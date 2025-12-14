import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faStar, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch products từ API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        setProducts(data);
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 8);
  const bestSellers = [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4);
  const heroProducts = [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 3);

  useEffect(() => {
    if (heroProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[400px] sm:min-h-[500px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden pt-20 sm:pt-28">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-5 sm:top-20 sm:left-20 w-40 sm:w-72 h-40 sm:h-72 bg-purple-500 rounded-full filter blur-[80px] sm:blur-[100px]"></div>
          <div className="absolute bottom-10 right-5 sm:bottom-20 sm:right-20 w-40 sm:w-72 h-40 sm:h-72 bg-pink-500 rounded-full filter blur-[80px] sm:blur-[100px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:pr-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-xs sm:text-sm text-purple-300 mb-4 sm:mb-6">
                <FontAwesomeIcon icon={faStar} className="text-yellow-400 w-3 h-3" />
                10,000+ khách hàng tin tưởng
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                Tài khoản
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">AI Premium</span>
              </h1>
              
              <p className="text-slate-400 mb-6 sm:mb-8 text-base sm:text-lg max-w-md mx-auto lg:mx-0">
                ChatGPT Plus, Claude Pro, Midjourney... Giao hàng tự động, bảo hành 30 ngày.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8 sm:mb-10 justify-center lg:justify-start">
                <Link to="/products" className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 text-sm sm:text-base">
                  Mua ngay <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                <Link to="/register" className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm sm:text-base">
                  Đăng ký nhận ưu đãi
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-6 sm:gap-8 justify-center lg:justify-start">
                {[
                  { value: '10K+', label: 'Khách hàng' },
                  { value: '50K+', label: 'Đơn hàng' },
                  { value: '99%', label: 'Hài lòng' }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Product Cards Stack */}
            <div className="hidden lg:flex relative h-[400px] items-center justify-center">
              {heroProducts.map((product, index) => {
                const isActive = index === currentSlide;
                const isPrev = index === (currentSlide - 1 + heroProducts.length) % heroProducts.length;
                const isNext = index === (currentSlide + 1) % heroProducts.length;
                
                let transform = 'translateX(100%) scale(0.8)';
                let opacity = 0;
                let zIndex = 0;
                
                if (isActive) {
                  transform = 'translateX(0) scale(1)';
                  opacity = 1;
                  zIndex = 30;
                } else if (isPrev) {
                  transform = 'translateX(-30%) scale(0.85)';
                  opacity = 0.5;
                  zIndex = 20;
                } else if (isNext) {
                  transform = 'translateX(30%) scale(0.85)';
                  opacity = 0.5;
                  zIndex = 20;
                }

                return (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="absolute w-[280px] transition-all duration-500 ease-out"
                    style={{ transform, opacity, zIndex }}
                  >
                    <div className="bg-white rounded-2xl p-4 shadow-2xl">
                      {/* Image */}
                      <div className="relative h-[180px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 mb-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <span className="text-5xl font-bold text-white/50">{product.name.charAt(0)}</span>
                          </div>
                        )}
                        {product.badge && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">{product.badge}</span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <p className="text-[10px] text-purple-600 font-medium">{product.category?.name}</p>
                      <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600">{formatPrice(product.price)}</span>
                        <div className="flex items-center text-xs text-slate-500">
                          <FontAwesomeIcon icon={faStar} className="text-yellow-400 w-3 h-3 mr-1" />
                          5.0
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Dots */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {heroProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all ${currentSlide === i ? 'w-6 bg-purple-500' : 'w-2 bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Sản phẩm nổi bật</h2>
              <p className="text-slate-500 text-sm">Được khách hàng tin dùng nhiều nhất</p>
            </div>
            <Link to="/products" className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1">
              Xem tất cả <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Chưa có sản phẩm nổi bật</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers - Compact */}
      <section className="py-8 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Bán chạy nhất</h2>
                <p className="text-xs text-slate-500">Top sản phẩm được yêu thích</p>
              </div>
            </div>
            <Link to="/products" className="text-orange-600 text-sm font-medium hover:text-orange-700 flex items-center gap-1">
              Xem tất cả <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>
          
          {/* Products - Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible scrollbar-hide">
            {bestSellers.map((product, index) => (
              <Link 
                key={product._id} 
                to={`/products/${product._id}`}
                className="flex-shrink-0 w-[160px] lg:w-auto group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-orange-100 hover:border-orange-300"
              >
                {/* Ranking Badge */}
                <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  index === 1 ? 'bg-slate-300 text-slate-700' : 
                  index === 2 ? 'bg-amber-500 text-white' : 
                  'bg-purple-400 text-white'
                }`}>
                  {index + 1}
                </div>

                {/* Discount Badge */}
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </div>
                )}
                
                {/* Image */}
                <div className="relative h-28 lg:h-32 overflow-hidden bg-slate-100">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-amber-500">
                      <span className="text-3xl font-bold text-white/50">{product.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-2.5">
                  <p className="text-[10px] text-orange-600 font-medium truncate">{product.category?.name}</p>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-1">
                    <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-slate-500">{product.sold?.toLocaleString() || 0} đã bán</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-orange-600">{formatPrice(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 sm:mb-3">Nhận ưu đãi 10%</h2>
          <p className="text-slate-500 mb-4 sm:mb-6 text-xs sm:text-sm">Đăng ký email để nhận mã giảm giá cho đơn hàng đầu tiên</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="email" placeholder="Email của bạn" className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" />
            <button className="px-5 py-2.5 sm:py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm">
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
