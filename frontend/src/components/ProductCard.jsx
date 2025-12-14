import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faBolt } from '@fortawesome/free-solid-svg-icons';

export default function ProductCard({ product, dark = false }) {
  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <Link 
      to={`/products/${product._id}`} 
      className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        dark ? 'bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15' : 'bg-white shadow-sm hover:shadow-lg border border-slate-100'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-3xl sm:text-4xl font-bold text-white/80">{product.name.charAt(0)}</span>
          </div>
        )}
        
        <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 w-7 sm:w-9 h-7 sm:h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md sm:rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 shadow-md transition-all">
          <FontAwesomeIcon icon={faBolt} className="w-3 sm:w-4 h-3 sm:h-4" />
        </div>

        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-0.5 sm:gap-1">
          {product.badge && (
            <span className={`${product.badgeColor || 'bg-purple-500'} text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full`}>{product.badge}</span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">-{discount}%</span>
          )}
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">Hết hàng</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-orange-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">Còn {product.stock}</span>
        )}
      </div>

      <div className="p-2 sm:p-3">
        <span className={`text-[9px] sm:text-[10px] font-medium ${dark ? 'text-purple-400' : 'text-purple-600'}`}>{product.category?.name}</span>
        <h3 className={`font-medium text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2 group-hover:text-purple-500 transition-colors ${dark ? 'text-white' : 'text-slate-800'}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faStar} className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-yellow-400" />
            <span className={`text-[9px] sm:text-[10px] ml-0.5 sm:ml-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>5.0</span>
          </div>
          <span className={`text-[9px] sm:text-[10px] ${dark ? 'text-slate-400' : 'text-slate-400'}`}>| {product.sold?.toLocaleString() || 0} đã bán</span>
        </div>
        <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
          <span className={`text-sm sm:text-base font-bold ${dark ? 'text-white' : 'text-purple-600'}`}>{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className={`text-[10px] sm:text-xs line-through ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
