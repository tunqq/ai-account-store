import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faShieldHalved, faHeadset, faClock, faPhone, faEnvelope, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faFacebookMessenger, faTelegram, faDiscord } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  return (
    <>
      {/* Features Section - Sáng hơn */}
      <section className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-t border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all">
              <div className="w-9 sm:w-12 md:w-14 h-9 sm:h-12 md:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 flex-shrink-0">
                <FontAwesomeIcon icon={faBolt} className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base truncate">Giao hàng tức thì</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm truncate">Nhận ngay sau thanh toán</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-green-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all">
              <div className="w-9 sm:w-12 md:w-14 h-9 sm:h-12 md:h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-200 flex-shrink-0">
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base truncate">Bảo hành 30 ngày</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm truncate">Đổi mới nếu có vấn đề</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-9 sm:w-12 md:w-14 h-9 sm:h-12 md:h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                <FontAwesomeIcon icon={faHeadset} className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base truncate">Hỗ trợ 24/7</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm truncate">CSKH luôn sẵn sàng</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-pink-100 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all">
              <div className="w-9 sm:w-12 md:w-14 h-9 sm:h-12 md:h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-pink-200 flex-shrink-0">
                <FontAwesomeIcon icon={faClock} className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base truncate">Thanh toán dễ</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm truncate">VietQR, Momo, Banking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer - Sáng hơn */}
      <footer className="bg-gradient-to-b from-slate-50 to-white text-slate-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-[150px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-block mb-4 sm:mb-6">
                <img src="/1.png" alt="AI-ZONE SHOP" className="h-12 sm:h-16 w-auto hover:scale-105 transition-transform duration-300" />
              </Link>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                Cửa hàng tài khoản AI Premium uy tín hàng đầu Việt Nam. Giao hàng tự động 24/7.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <a href="#" className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-blue-300 transition-all hover:scale-110">
                  <FontAwesomeIcon icon={faFacebookF} className="w-4 sm:w-5 h-4 sm:h-5" />
                </a>
                <a href="#" className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-purple-300 transition-all hover:scale-110">
                  <FontAwesomeIcon icon={faFacebookMessenger} className="w-4 sm:w-5 h-4 sm:h-5" />
                </a>
                <a href="#" className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-sky-300 transition-all hover:scale-110">
                  <FontAwesomeIcon icon={faTelegram} className="w-4 sm:w-5 h-4 sm:h-5" />
                </a>
                <a href="#" className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-indigo-300 transition-all hover:scale-110">
                  <FontAwesomeIcon icon={faDiscord} className="w-4 sm:w-5 h-4 sm:h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-6 text-slate-800">Liên kết nhanh</h3>
              <ul className="space-y-2 sm:space-y-4">
                {[
                  { label: 'Trang chủ', path: '/' },
                  { label: 'Sản phẩm', path: '/products' },
                  { label: 'Đơn hàng của tôi', path: '/orders' },
                  { label: 'Đăng ký', path: '/register' }
                ].map((link, i) => (
                  <li key={i}>
                    <Link to={link.path} className="text-slate-600 hover:text-purple-600 transition-colors text-sm sm:text-base flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-6 text-slate-800">Hỗ trợ</h3>
              <ul className="space-y-2 sm:space-y-4">
                {[
                  { label: 'Hướng dẫn mua hàng', path: '/guide' },
                  { label: 'Chính sách bảo hành', path: '/warranty' },
                  { label: 'Câu hỏi thường gặp', path: '/faq' },
                  { label: 'Điều khoản sử dụng', path: '/terms' }
                ].map((item, i) => (
                  <li key={i}>
                    <Link to={item.path} className="text-slate-600 hover:text-purple-600 transition-colors text-sm sm:text-base flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 md:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-6 text-slate-800">Liên hệ</h3>
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <a href="tel:0123456789" className="flex items-center gap-2 sm:gap-3 text-slate-600 hover:text-purple-600 transition-colors group">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md shadow-green-200 group-hover:shadow-lg group-hover:shadow-green-300 transition-all">
                      <FontAwesomeIcon icon={faPhone} className="w-3 sm:w-4 h-3 sm:h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">0123 456 789</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:support@aizoneshop.vn" className="flex items-center gap-2 sm:gap-3 text-slate-600 hover:text-purple-600 transition-colors group">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:shadow-lg group-hover:shadow-blue-300 transition-all">
                      <FontAwesomeIcon icon={faEnvelope} className="w-3 sm:w-4 h-3 sm:h-4" />
                    </div>
                    <span className="text-sm sm:text-base truncate">support@aizoneshop.vn</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-2 sm:gap-3 text-slate-600">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-200">
                      <FontAwesomeIcon icon={faLocationDot} className="w-3 sm:w-4 h-3 sm:h-4" />
                    </div>
                    <span className="text-sm sm:text-base">Hà Nội, Việt Nam</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-slate-500 text-xs sm:text-sm">© 2025 AI-ZONE SHOP. All rights reserved.</p>
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
              <span className="text-slate-500 text-xs sm:text-sm hidden sm:inline">Thanh toán an toàn với</span>
              <div className="flex gap-1.5 sm:gap-2">
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold text-white shadow-sm">VietQR</div>
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold text-white shadow-sm">Momo</div>
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold text-white shadow-sm">Banking</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
