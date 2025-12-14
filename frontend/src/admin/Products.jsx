import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiLoader, FiUpload, FiImage, FiKey } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedProductForAccounts, setSelectedProductForAccounts] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [accountStats, setAccountStats] = useState({});
  const [quickAddText, setQuickAddText] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '', category: '',
    features: '', isActive: true, isFeatured: false,
    defaultExpiryDays: 0, defaultWarrantyDays: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch data từ API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Admin cần lấy tất cả products (kể cả inactive)
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products/admin/all'),
        api.get('/categories/admin')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      
      // Fetch account stats cho mỗi product
      const statsPromises = productsRes.data.map(p => 
        api.get(`/accounts/stats/${p._id}`).catch(() => ({ data: { available: 0, total: 0 } }))
      );
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      productsRes.data.forEach((p, i) => {
        statsMap[p._id] = statsResults[i].data;
      });
      setAccountStats(statsMap);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error.message);
      toast.error('Không thể tải dữ liệu từ server');
    } finally {
      setLoading(false);
    }
  };

  // Quick add accounts
  const openQuickAddModal = (product) => {
    setSelectedProductForAccounts(product);
    setQuickAddText('');
    setShowQuickAddModal(true);
  };

  const handleQuickAddAccounts = async () => {
    if (!quickAddText.trim()) {
      toast.error('Vui lòng nhập danh sách tài khoản');
      return;
    }

    const lines = quickAddText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      toast.error('Không có tài khoản hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const accounts = lines.map(line => ({ credentials: line.trim() }));
      const { data } = await api.post('/accounts/bulk', { 
        productId: selectedProductForAccounts._id, 
        accounts 
      });
      toast.success(data.message);
      setShowQuickAddModal(false);
      setQuickAddText('');
      
      // Refresh stats
      const statsRes = await api.get(`/accounts/stats/${selectedProductForAccounts._id}`);
      setAccountStats(prev => ({ ...prev, [selectedProductForAccounts._id]: statsRes.data }));
      
      // Update product stock in list
      setProducts(prev => prev.map(p => 
        p._id === selectedProductForAccounts._id 
          ? { ...p, stock: statsRes.data.available }
          : p
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice || '',
        category: product.category?._id || '',
        features: product.features?.join('\n') || '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        defaultExpiryDays: product.defaultExpiryDays || 0,
        defaultWarrantyDays: product.defaultWarrantyDays || 0
      });
      setImagePreview(product.image || null);
    } else {
      setEditingProduct(null);
      setForm({
        name: '', description: '', price: '', originalPrice: '', category: '',
        features: '', isActive: true, isFeatured: false,
        defaultExpiryDays: 0, defaultWarrantyDays: 0
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh tối đa 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    
    // Tạo FormData để gửi lên server
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('originalPrice', form.originalPrice || '');
    formData.append('category', form.category);
    formData.append('features', JSON.stringify(form.features.split('\n').filter(f => f.trim())));
    formData.append('isActive', form.isActive ? 'true' : 'false');
    formData.append('isFeatured', form.isFeatured ? 'true' : 'false');
    formData.append('defaultExpiryDays', form.defaultExpiryDays || 0);
    formData.append('defaultWarrantyDays', form.defaultWarrantyDays || 0);
    // Không gửi stock và accountData vì được quản lý qua Accounts
    
    // Thêm file ảnh nếu có
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Thêm sản phẩm thành công!');
      }
      setShowModal(false);
      fetchData(); // Reload data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Đã xóa sản phẩm');
      fetchData(); // Reload data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý sản phẩm</h1>
          <p className="text-slate-500">{products.length} sản phẩm</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          <FiPlus className="mr-2" /> Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">Danh mục</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Giá</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tài khoản</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden xl:table-cell">Đã bán</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const stats = accountStats[product._id] || { available: 0, total: 0, sold: 0 };
                return (
                <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <span className="text-white font-bold">{product.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate max-w-[150px]">{product.name}</p>
                        {product.isFeatured && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Nổi bật</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div>
                      <span className="text-slate-600 text-sm">{product.category?.name || '-'}</span>
                      {product.category && product.category.isActive === false && (
                        <span className="block text-[10px] text-red-500">⚠️ Ẩn</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-purple-600 text-sm">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="block text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="text-center">
                        <span className={`font-bold ${stats.available <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {stats.available}
                        </span>
                        <span className="text-slate-400 text-xs">/{stats.total}</span>
                      </div>
                      <button
                        onClick={() => openQuickAddModal(product)}
                        className="p-1 bg-green-100 text-green-600 hover:bg-green-200 rounded transition-colors"
                        title="Thêm nhanh"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-slate-600 font-medium text-sm">{stats.sold || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.isActive ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button 
                        onClick={() => navigate(`/admin/accounts?product=${product._id}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Quản lý tài khoản"
                      >
                        <FiKey className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal(product)} 
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product._id)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredProducts.map(product => {
            const stats = accountStats[product._id] || { available: 0, total: 0, sold: 0 };
            return (
              <div key={product._id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                        <span className="text-white font-bold text-lg">{product.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.category?.name || '-'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                        product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.isActive ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-bold text-purple-600">{formatPrice(product.price)}</span>
                      {product.isFeatured && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Nổi bật</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`font-bold ${stats.available <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.available}/{stats.total} còn
                    </span>
                    <span className="text-slate-500">{stats.sold || 0} đã bán</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openQuickAddModal(product)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/accounts?product=${product._id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <FiKey className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal(product)} 
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Upload hình ảnh */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hình ảnh sản phẩm</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-32 h-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border-2 border-dashed border-slate-300">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <FiImage className="w-8 h-8 mb-1" />
                        <span className="text-xs">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload button */}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <FiUpload className="w-4 h-4 mr-2" />
                      Chọn ảnh
                    </button>
                    <p className="text-xs text-slate-500 mt-2">PNG, JPG, WEBP. Tối đa 5MB</p>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="text-xs text-red-500 hover:text-red-600 mt-1"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tên sản phẩm *</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})} 
                    className="input" 
                    placeholder="VD: ChatGPT Plus 1 Tháng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Danh mục *</label>
                  <select 
                    value={form.category} 
                    onChange={(e) => setForm({...form, category: e.target.value})} 
                    className="input"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})} 
                  className="input" 
                  rows="3"
                  placeholder="Mô tả chi tiết sản phẩm..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Giá bán *</label>
                  <input 
                    type="number" 
                    value={form.price} 
                    onChange={(e) => setForm({...form, price: e.target.value})} 
                    className="input"
                    placeholder="250000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Giá gốc (để hiện giảm giá)</label>
                  <input 
                    type="number" 
                    value={form.originalPrice} 
                    onChange={(e) => setForm({...form, originalPrice: e.target.value})} 
                    className="input"
                    placeholder="500000"
                  />
                </div>
              </div>

              {/* Thông báo về quản lý tài khoản */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  <strong>💡 Lưu ý:</strong> Số lượng tồn kho được tính tự động từ số tài khoản còn hàng. 
                  Sau khi tạo sản phẩm, hãy vào <strong>Quản lý tài khoản</strong> để thêm tài khoản cho sản phẩm này.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tính năng (mỗi dòng 1 tính năng)</label>
                <textarea 
                  value={form.features} 
                  onChange={(e) => setForm({...form, features: e.target.value})} 
                  className="input" 
                  rows="4"
                  placeholder="GPT-4 Turbo&#10;DALL-E 3&#10;Browsing Internet&#10;..."
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                    className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Hiển thị</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isFeatured} 
                    onChange={(e) => setForm({...form, isFeatured: e.target.checked})} 
                    className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Sản phẩm nổi bật</span>
                </label>
              </div>

              {/* Auto Expiry Settings */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-3">⏰ Tự động tính ngày hết hạn</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Số ngày hết hạn</label>
                    <input
                      type="number"
                      min="0"
                      value={form.defaultExpiryDays}
                      onChange={(e) => setForm({...form, defaultExpiryDays: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="VD: 30"
                    />
                    <p className="text-xs text-blue-600 mt-1">0 = không tự động</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Số ngày bảo hành</label>
                    <input
                      type="number"
                      min="0"
                      value={form.defaultWarrantyDays}
                      onChange={(e) => setForm({...form, defaultWarrantyDays: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="VD: 7"
                    />
                    <p className="text-xs text-blue-600 mt-1">0 = không bảo hành</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Khi thêm tài khoản mới, hệ thống sẽ tự động tính ngày hết hạn = hôm nay + số ngày
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center"
                >
                  {submitting && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Accounts Modal */}
      {showQuickAddModal && selectedProductForAccounts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Thêm nhanh tài khoản</h2>
                <p className="text-sm text-purple-600 mt-1">{selectedProductForAccounts.name}</p>
              </div>
              <button onClick={() => setShowQuickAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 text-sm">
                <p className="font-medium text-purple-700 mb-2">💡 Hướng dẫn:</p>
                <p className="text-purple-600">Mỗi dòng là 1 tài khoản. Ví dụ:</p>
                <pre className="mt-2 bg-white p-3 rounded-lg text-xs text-slate-700 font-mono">
{`email1@gmail.com | pass123
email2@gmail.com | pass456`}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Danh sách tài khoản
                </label>
                <textarea
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                  rows="8"
                  placeholder="Nhập danh sách tài khoản..."
                  autoFocus
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-slate-500">
                    Số tài khoản: <span className="font-bold text-purple-600">{quickAddText.split('\n').filter(l => l.trim()).length}</span>
                  </span>
                  <span className="text-slate-500">
                    Hiện có: <span className="font-bold text-green-600">{accountStats[selectedProductForAccounts._id]?.available || 0}</span> còn hàng
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleQuickAddAccounts} 
                  disabled={submitting || !quickAddText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
                >
                  {submitting && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  <FiPlus className="w-4 h-4 mr-2" />
                  Thêm tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
