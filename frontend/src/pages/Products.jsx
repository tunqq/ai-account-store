import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faGrip, faList, faChevronDown, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  const categoryId = searchParams.get('category');

  // Fetch data từ API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ]);
        setAllProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter và sort products
  useEffect(() => {
    let filtered = [...allProducts];
    if (categoryId) filtered = filtered.filter(p => p.category?._id === categoryId);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      default: filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }
    setProducts(filtered);
  }, [allProducts, categoryId, search, sortBy, priceRange]);

  const currentCategory = categories.find(c => c._id === categoryId);

  return (
    <div className="min-h-screen bg-slate-50 pt-28">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg sm:text-xl font-bold">{currentCategory ? currentCategory.name : 'Tất cả sản phẩm'}</h1>
          <p className="text-white/80 text-xs sm:text-sm">{products.length} sản phẩm</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)} />
          )}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 overflow-y-auto' : 'hidden lg:block'}`}>
            <div className={`bg-white shadow-sm p-4 sm:p-5 border border-slate-100 ${showFilters ? 'min-h-full rounded-none' : 'rounded-2xl sticky top-20'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-purple-600" />
                  Bộ lọc
                </h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all placeholder:text-slate-400" 
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Danh mục</label>
                <div className="space-y-1">
                  <button 
                    onClick={() => setSearchParams({})}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                      !categoryId 
                        ? 'bg-purple-100 text-purple-700 font-semibold' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Tất cả ({allProducts.length})
                  </button>
                  {categories.map(cat => {
                    const catCount = allProducts.filter(p => p.category?._id === cat._id).length;
                    return (
                      <button 
                        key={cat._id} 
                        onClick={() => setSearchParams({ category: cat._id })}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 ${
                          categoryId === cat._id 
                            ? 'bg-purple-100 text-purple-700 font-semibold' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className={`w-7 h-7 bg-gradient-to-br ${cat.color} rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                          {cat.icon}
                        </span>
                        <span className="flex-1">{cat.name}</span>
                        {catCount > 0 && (
                          <span className="text-xs text-slate-400">({catCount})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Khoảng giá</label>
                <div className="space-y-1">
                  {[
                    { label: 'Tất cả', range: [0, 1000000] },
                    { label: 'Dưới 300K', range: [0, 300000] },
                    { label: '300K - 500K', range: [300000, 500000] },
                    { label: 'Trên 500K', range: [500000, 1000000] },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => setPriceRange(item.range)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                        priceRange[0] === item.range[0] && priceRange[1] === item.range[1] 
                          ? 'bg-purple-100 text-purple-700 font-semibold' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              {(categoryId || search || priceRange[0] !== 0 || priceRange[1] !== 1000000) && (
                <button 
                  onClick={() => {
                    setSearchParams({});
                    setSearch('');
                    setPriceRange([0, 1000000]);
                  }}
                  className="w-full mt-5 py-2.5 text-sm text-purple-600 font-medium hover:bg-purple-50 rounded-xl transition-colors border border-purple-200"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-sm">
                <FontAwesomeIcon icon={faFilter} className="mr-1.5 w-4 h-4" /> Lọc
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-slate-100 px-3 py-1.5 pr-8 rounded-lg text-slate-600 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer">
                    <option value="popular">Phổ biến</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá ↑</option>
                    <option value="price-desc">Giá ↓</option>
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                </div>

                <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}>
                    <FontAwesomeIcon icon={faGrip} className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}>
                    <FontAwesomeIcon icon={faList} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <span className="text-slate-500 text-xs">{products.length} sản phẩm</span>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <FontAwesomeIcon icon={faSpinner} className="w-10 h-10 text-purple-500 mx-auto mb-3 animate-spin" />
                <p className="text-slate-500 text-sm">Đang tải sản phẩm...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <FontAwesomeIcon icon={faSearch} className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-1">Không tìm thấy</h3>
                <p className="text-slate-500 text-sm">Thử thay đổi bộ lọc</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
