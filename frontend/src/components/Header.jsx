import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRightFromBracket, faBars, faXmark, faChevronDown, faSearch, faSpinner, faWallet } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import config from '../config';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Real-time search with debounce
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${config.api.baseUrl}/products?search=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.products || data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchProducts(searchQuery);
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchProducts]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
    setShowSearchResults(false);
    setSearchQuery('');
  }, [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isHomePage = location.pathname === '/';
  const showDarkText = isScrolled || !isHomePage;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      showDarkText ? 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg shadow-purple-500/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 md:h-24 gap-2 md:gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/1.png" 
              alt="AI-ZONE SHOP" 
              className="h-12 md:h-20 w-auto object-contain" 
            />
          </Link>

          {/* Mobile Search Bar */}
          <div className="flex-1 md:hidden" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full px-3 py-2 bg-white/10 rounded-lg text-sm text-white placeholder-white/60 outline-none border border-white/20"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70">
                <FontAwesomeIcon icon={isSearching ? faSpinner : faSearch} className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            <Link to="/" className={`px-5 py-2.5 rounded-xl text-base font-medium transition-all ${isActive('/') ? 'bg-purple-500/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
              Trang chủ
            </Link>
            <Link to="/products" className={`px-5 py-2.5 rounded-xl text-base font-medium transition-all ${isActive('/products') ? 'bg-purple-500/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
              Sản phẩm
            </Link>
            {isAuthenticated && (
              <Link to="/orders" className={`px-5 py-2.5 rounded-xl text-base font-medium transition-all ${isActive('/orders') ? 'bg-purple-500/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
                Đơn hàng
              </Link>
            )}
          </nav>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-lg hidden md:block">
            <form onSubmit={handleSearch} className="relative" ref={searchRef}>
              <div className="flex items-center bg-white/10 rounded-xl overflow-hidden border border-white/20">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full px-5 py-3 bg-transparent outline-none text-base text-white placeholder-white/60"
                />
                <button type="submit" className="px-5 py-3 text-white/70 hover:text-white">
                  <FontAwesomeIcon icon={isSearching ? faSpinner : faSearch} className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {showSearchResults && (searchResults.length > 0 || searchQuery.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-fadeIn">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-purple-500" />
                      <p className="text-sm text-slate-500 mt-2">Đang tìm kiếm...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2">
                        {searchResults.slice(0, 5).map(product => (
                          <Link key={product._id} to={`/products/${product._id}`} onClick={() => setShowSearchResults(false)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${product.category?.color || 'from-purple-500 to-pink-500'}`}>
                                <span className="text-white text-xs font-bold">{product.name.charAt(0)}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                              <p className="text-xs text-slate-500">{product.category?.name}</p>
                            </div>
                            <span className="text-sm font-bold text-purple-600">{new Intl.NumberFormat('vi-VN').format(product.price)}đ</span>
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 p-2">
                        <button onClick={handleSearch} className="w-full py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg font-medium">
                          Xem tất cả kết quả cho "{searchQuery}"
                        </button>
                      </div>
                    </>
                  ) : searchQuery.length > 0 ? (
                    <div className="p-4 text-center"><p className="text-sm text-slate-500">Không tìm thấy sản phẩm</p></div>
                  ) : null}
                  
                </div>
              )}
            </form>
            </div>

            {/* Auth Buttons - Desktop only */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{user?.name?.charAt(0)}</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-white/70" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[100] animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-medium text-slate-800 text-sm">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link to="/wallet" onClick={() => setShowUserMenu(false)} className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-purple-600">
                      <span className="flex items-center">
                        <FontAwesomeIcon icon={faWallet} className="w-4 h-4 mr-2" />Ví xu
                      </span>
                      <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                        {(user?.balance || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </Link>
                    <Link to="/orders" onClick={() => setShowUserMenu(false)} className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-purple-600">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />Đơn hàng
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium">
                        ⚡ Admin
                      </Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                      <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4 mr-2" />Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 rounded-xl text-base font-medium text-white/90 hover:text-white hover:bg-white/10">
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white flex-shrink-0">
            <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-white shadow-xl border-t border-slate-100 animate-slideDown overflow-y-auto z-50">
            <nav className="p-4 space-y-2 pb-20">
              <Link to="/" className={`block px-4 py-3 rounded-xl font-medium ${isActive('/') ? 'bg-purple-100 text-purple-600' : 'text-slate-600 hover:bg-slate-50'}`}>Trang chủ</Link>
              <Link to="/products" className={`block px-4 py-3 rounded-xl font-medium ${isActive('/products') ? 'bg-purple-100 text-purple-600' : 'text-slate-600 hover:bg-slate-50'}`}>Sản phẩm</Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/orders" className={`block px-4 py-3 rounded-xl font-medium ${isActive('/orders') ? 'bg-purple-100 text-purple-600' : 'text-slate-600 hover:bg-slate-50'}`}>Đơn hàng</Link>
                  <Link to="/wallet" className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium ${isActive('/wallet') ? 'bg-purple-100 text-purple-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
                      Ví xu
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                      {(user?.balance || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </Link>
                </>
              )}
              
              <hr className="my-3 border-slate-100" />
              
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 bg-slate-50 rounded-xl">
                    <p className="font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                  </div>
                  {user?.role === 'admin' && <Link to="/admin" className="block px-4 py-3 rounded-xl font-medium text-purple-600 bg-purple-50">⚡ Admin Panel</Link>}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50">Đăng xuất</button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className="block px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 text-center">Đăng nhập</Link>
                  <Link to="/register" className="block px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 text-center">Đăng ký</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
