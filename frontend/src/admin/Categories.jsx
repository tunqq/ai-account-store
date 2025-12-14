import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiLoader, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });

  const colors = [
    'from-green-400 to-emerald-600',
    'from-orange-400 to-red-600',
    'from-blue-400 to-indigo-600',
    'from-cyan-400 to-blue-600',
    'from-purple-400 to-pink-600',
    'from-yellow-400 to-orange-600',
    'from-pink-400 to-rose-600',
  ];

  // Fetch categories từ API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Admin cần lấy tất cả categories (kể cả inactive)
      const [categoriesRes, statsRes] = await Promise.all([
        api.get('/categories/admin'),
        api.get('/categories/admin/stats').catch(() => ({ data: [] }))
      ]);
      setCategories(categoriesRes.data);
      
      // Map stats by category id
      const statsMap = {};
      statsRes.data.forEach(s => { statsMap[s._id] = s; });
      setCategoryStats(statsMap);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error.message);
      toast.error('Không thể tải danh mục từ server');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setForm({ name: category.name, description: category.description || '', isActive: category.isActive !== false });
    } else {
      setEditingCategory(null);
      setForm({ name: '', description: '', isActive: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    // Cảnh báo khi ẩn category có products
    if (editingCategory && !form.isActive && editingCategory.isActive) {
      const stats = categoryStats[editingCategory._id];
      if (stats && stats.totalProducts > 0) {
        const confirmed = confirm(
          `⚠️ Danh mục này có ${stats.totalProducts} sản phẩm.\n\n` +
          `Khi ẩn danh mục, tất cả ${stats.totalProducts} sản phẩm thuộc danh mục này sẽ không hiển thị cho khách hàng.\n\n` +
          `Bạn có chắc muốn tiếp tục?`
        );
        if (!confirmed) return;
      }
    }

    setSubmitting(true);
    
    // Tạo FormData để gửi lên server
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('isActive', form.isActive ? 'true' : 'false');

    try {
      if (editingCategory) {
        const { data } = await api.put(`/categories/${editingCategory._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (data.message) {
          toast.success(data.message, { duration: 5000 });
        } else {
          toast.success('Cập nhật danh mục thành công!');
        }
      } else {
        await api.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Thêm danh mục thành công!');
      }
      setShowModal(false);
      fetchCategories(); // Reload data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Đã xóa danh mục');
      fetchCategories(); // Reload data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800">Quản lý danh mục</h1>
          <p className="text-slate-500">{categories.length} danh mục</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          <FiPlus className="mr-2" /> Thêm danh mục
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((category, index) => {
          const stats = categoryStats[category._id] || { totalProducts: 0, activeProducts: 0 };
          return (
          <div key={category._id} className={`bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow ${category.isActive === false ? 'opacity-75' : ''}`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${category.color || colors[index % colors.length]} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-lg sm:text-2xl font-bold text-white">{category.icon || category.name.substring(0, 2).toUpperCase()}</span>
              </div>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                category.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {category.isActive !== false ? 'ON' : 'OFF'}
              </span>
            </div>
            
            <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-1 sm:mb-2">{category.name}</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
              {category.description || 'Không có mô tả'}
            </p>

            {/* Warning khi category ẩn nhưng có products */}
            {category.isActive === false && stats.totalProducts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 flex items-start gap-2">
                <FiAlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-yellow-700">
                  {stats.totalProducts} sản phẩm đang bị ẩn
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                <FiPackage className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium text-purple-600">{stats.totalProducts}</span> SP
              </div>
              <div className="flex gap-1 sm:gap-2">
                <button 
                  onClick={() => openModal(category)} 
                  className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(category._id)} 
                  className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-scaleIn">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tên danh mục *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="input"
                  placeholder="VD: ChatGPT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})} 
                  className="input" 
                  rows="3"
                  placeholder="Mô tả danh mục..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                    className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-700">Hiển thị danh mục</span>
                </label>
                
                {/* Cảnh báo khi ẩn category có products */}
                {editingCategory && !form.isActive && categoryStats[editingCategory._id]?.totalProducts > 0 && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Cảnh báo!</p>
                      <p>Danh mục này có <strong>{categoryStats[editingCategory._id].totalProducts}</strong> sản phẩm. Khi ẩn danh mục, tất cả sản phẩm sẽ không hiển thị cho khách hàng.</p>
                    </div>
                  </div>
                )}
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
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
