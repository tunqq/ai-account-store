import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiLoader, FiUpload, FiCopy, FiEye, FiEyeOff, FiArrowLeft, FiRefreshCw, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminAccounts() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(productId || '');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState({});
  const [stats, setStats] = useState({ available: 0, reserved: 0, sold: 0, disabled: 0, total: 0 });
  
  const [form, setForm] = useState({ credentials: '', note: '', expiryDate: '', purchaseDate: '', warrantyExpires: '' });
  const [bulkText, setBulkText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showAllCredentials, setShowAllCredentials] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products/admin/all');
        setProducts(data);
        if (!selectedProduct && data.length > 0) {
          setSelectedProduct(data[0]._id);
        }
      } catch (error) {
        toast.error('Không thể tải danh sách sản phẩm');
      }
    };
    fetchProducts();
  }, []);

  // Fetch accounts when product changes
  useEffect(() => {
    if (selectedProduct) {
      fetchAccounts();
      fetchStats();
    }
  }, [selectedProduct, filterStatus]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      let url;
      if (selectedProduct === 'all') {
        // Lấy tất cả tài khoản
        url = '/accounts/all';
        if (filterStatus) url += `?status=${filterStatus}`;
      } else {
        url = `/accounts/product/${selectedProduct}`;
        if (filterStatus) url += `?status=${filterStatus}`;
      }
      const { data } = await api.get(url);
      setAccounts(data);
    } catch (error) {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/accounts/stats/${selectedProduct}`);
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const openModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setForm({ 
        credentials: account.credentials, 
        note: account.note || '',
        expiryDate: account.expiryDate ? account.expiryDate.split('T')[0] : '',
        purchaseDate: account.purchaseDate ? account.purchaseDate.split('T')[0] : '',
        warrantyExpires: account.warrantyExpires ? account.warrantyExpires.split('T')[0] : ''
      });
    } else {
      setEditingAccount(null);
      setForm({ credentials: '', note: '', expiryDate: '', purchaseDate: '', warrantyExpires: '' });
    }
    setShowModal(true);
  };

  // Helper: Check if account is expiring soon (within 7 days)
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const expiry = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  // Helper: Check if account is expired
  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.credentials.trim()) {
      toast.error('Vui lòng nhập thông tin tài khoản');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount._id}`, form);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/accounts', { productId: selectedProduct, ...form });
        toast.success('Thêm tài khoản thành công');
      }
      setShowModal(false);
      fetchAccounts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast.error('Vui lòng nhập danh sách tài khoản');
      return;
    }

    // Parse: mỗi dòng là 1 tài khoản, có thể có date ở cuối
    const lines = bulkText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      toast.error('Không có tài khoản hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const accounts = lines.map(line => {
        const parts = line.trim().split('|').map(p => p.trim());
        const account = { credentials: parts[0] };
        
        // Nếu có phần thứ 2 và không phải date thì ghép vào credentials
        if (parts.length >= 2) {
          // Check if last part is a date (YYYY-MM-DD format)
          const lastPart = parts[parts.length - 1];
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          
          if (dateRegex.test(lastPart)) {
            // Last part is date
            account.expiryDate = lastPart;
            // Credentials is everything except the date
            account.credentials = parts.slice(0, -1).join(' | ');
          } else {
            // No date, join all parts as credentials
            account.credentials = parts.join(' | ');
          }
        }
        
        return account;
      });
      
      const { data } = await api.post('/accounts/bulk', { productId: selectedProduct, accounts });
      toast.success(data.message);
      setShowBulkModal(false);
      setBulkText('');
      fetchAccounts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    
    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Đã xóa tài khoản');
      fetchAccounts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa');
    }
  };

  const toggleCredentials = (id) => {
    setShowCredentials(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllCredentials = () => {
    if (showAllCredentials) {
      setShowCredentials({});
    } else {
      const all = {};
      accounts.forEach(acc => { all[acc._id] = true; });
      setShowCredentials(all);
    }
    setShowAllCredentials(!showAllCredentials);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép');
  };

  const copyAllCredentials = () => {
    const allCreds = filteredAccounts.map(acc => acc.credentials).join('\n');
    navigator.clipboard.writeText(allCreds);
    toast.success(`Đã sao chép ${filteredAccounts.length} tài khoản`);
  };

  // Filter accounts by search
  const filteredAccounts = accounts.filter(acc => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return acc.credentials?.toLowerCase().includes(search) ||
           acc.note?.toLowerCase().includes(search) ||
           acc.soldToEmail?.toLowerCase().includes(search) ||
           acc.soldTo?.email?.toLowerCase().includes(search);
  });

  // Toggle account status (available <-> disabled)
  const toggleAccountStatus = async (account) => {
    const newStatus = account.status === 'available' ? 'disabled' : 'available';
    try {
      await api.put(`/accounts/${account._id}`, { status: newStatus });
      toast.success(`Đã ${newStatus === 'disabled' ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản`);
      fetchAccounts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-green-100 text-green-700',
      reserved: 'bg-yellow-100 text-yellow-700',
      sold: 'bg-blue-100 text-blue-700',
      disabled: 'bg-red-100 text-red-700'
    };
    const labels = {
      available: 'Còn hàng',
      reserved: 'Đang giữ',
      sold: 'Đã bán',
      disabled: 'Vô hiệu'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const currentProduct = products.find(p => p._id === selectedProduct);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <FiArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý tài khoản</h1>
            <p className="text-slate-500">
              {selectedProduct === 'all' ? (
                <span className="text-purple-600 font-medium">📊 Xem tất cả sản phẩm</span>
              ) : currentProduct ? (
                <span>Sản phẩm: <span className="text-purple-600 font-medium">{currentProduct.name}</span></span>
              ) : 'Chọn sản phẩm để quản lý'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAccounts} disabled={!selectedProduct}
            className="flex items-center px-3 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            title="Làm mới">
            <FiRefreshCw className="w-4 h-4" />
          </button>
          {selectedProduct && selectedProduct !== 'all' && (
            <>
              <button onClick={() => setShowBulkModal(true)}
                className="flex items-center px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">
                <FiUpload className="mr-2" /> Import
              </button>
              <button onClick={() => openModal()}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                <FiPlus className="mr-2" /> Thêm tài khoản
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Selector & Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Chọn sản phẩm</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">-- Chọn sản phẩm --</option>
            <option value="all">📊 Tất cả sản phẩm (Thống kê)</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Thống kê</label>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 text-center p-2 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                <div className="text-green-600">Còn hàng</div>
              </div>
              <div className="flex-1 text-center p-2 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
                <div className="text-yellow-600">Đang giữ</div>
              </div>
              <div className="flex-1 text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
                <div className="text-blue-600">Đã bán</div>
              </div>
              <div className="flex-1 text-center p-2 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-600">{stats.total}</div>
                <div className="text-slate-600">Tổng</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search */}
      {selectedProduct && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['', 'available', 'reserved', 'sold', 'disabled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === '' ? `Tất cả (${stats.total})` : 
                   status === 'available' ? `Còn hàng (${stats.available})` : 
                   status === 'reserved' ? `Đang giữ (${stats.reserved})` : 
                   status === 'sold' ? `Đã bán (${stats.sold})` : 
                   `Vô hiệu (${stats.disabled})`}
                </button>
              ))}
            </div>
            
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm tài khoản, email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : !selectedProduct ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-slate-500">Vui lòng chọn sản phẩm để xem tài khoản</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-slate-500">{searchText ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản nào'}</p>
          {!searchText && (
            <button onClick={() => openModal()} className="mt-4 text-purple-600 hover:underline">
              Thêm tài khoản đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Table Actions */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Hiển thị <span className="font-bold text-purple-600">{filteredAccounts.length}</span> tài khoản
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAllCredentials}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {showAllCredentials ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                {showAllCredentials ? 'Ẩn tất cả' : 'Hiện tất cả'}
              </button>
              <button
                onClick={copyAllCredentials}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors"
              >
                <FiCopy className="w-4 h-4" />
                Copy tất cả
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full hidden md:table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
                  {selectedProduct === 'all' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Sản phẩm</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tài khoản</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden xl:table-cell">Ngày mua</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Hết hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">Người mua</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc, index) => (
                  <tr key={acc._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 text-sm">{index + 1}</td>
                    {selectedProduct === 'all' && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {acc.product?.image ? (
                            <img src={acc.product.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{acc.product?.name?.charAt(0) || '?'}</span>
                            </div>
                          )}
                          <span className="text-xs text-slate-700 truncate max-w-[100px]">{acc.product?.name || 'N/A'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className={`bg-slate-100 px-2 py-1 rounded text-xs max-w-[200px] ${showCredentials[acc._id] ? 'whitespace-pre-wrap' : 'truncate'}`}>
                          {showCredentials[acc._id] ? acc.credentials : '••••••••••••'}
                        </code>
                        <button onClick={() => toggleCredentials(acc._id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                          {showCredentials[acc._id] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => copyToClipboard(acc.credentials)} className="text-slate-400 hover:text-purple-600 flex-shrink-0">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[100px] truncate hidden lg:table-cell">{acc.note || '-'}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-slate-600">{formatDate(acc.purchaseDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {acc.expiryDate ? (
                        <span className={`text-xs font-medium ${
                          isExpired(acc.expiryDate) ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' :
                          isExpiringSoon(acc.expiryDate) ? 'text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded' :
                          'text-slate-600'
                        }`}>
                          {isExpired(acc.expiryDate) && '⚠️'}
                          {isExpiringSoon(acc.expiryDate) && '⏰'}
                          {formatDate(acc.expiryDate)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(acc.status)}</td>
                    <td className="px-4 py-3 text-xs hidden lg:table-cell">
                      {acc.soldTo ? (
                        <div>
                          <div className="font-medium text-slate-800">{acc.soldTo.name}</div>
                          <div className="text-slate-500">{acc.soldTo.email}</div>
                        </div>
                      ) : acc.soldToEmail ? (
                        <div className="text-slate-600 truncate max-w-[120px]">{acc.soldToEmail}</div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {(acc.status === 'available' || acc.status === 'disabled') && (
                          <button 
                            onClick={() => toggleAccountStatus(acc)} 
                            className={`p-1.5 rounded-lg transition-colors ${
                              acc.status === 'available' 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={acc.status === 'available' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {acc.status === 'available' ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                          </button>
                        )}
                        {acc.status !== 'sold' && (
                          <>
                            <button onClick={() => openModal(acc)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg">
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(acc._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAccounts.map((acc, index) => (
                <div key={acc._id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400">#{index + 1}</span>
                        {getStatusBadge(acc.status)}
                        {selectedProduct === 'all' && acc.product && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                            {acc.product.name}
                          </span>
                        )}
                      </div>
                      <code className={`block bg-slate-100 px-2 py-1 rounded text-xs ${showCredentials[acc._id] ? 'whitespace-pre-wrap' : 'truncate'}`}>
                        {showCredentials[acc._id] ? acc.credentials : '••••••••••••'}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleCredentials(acc._id)} className="p-1.5 text-slate-400 hover:text-slate-600">
                        {showCredentials[acc._id] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => copyToClipboard(acc.credentials)} className="p-1.5 text-slate-400 hover:text-purple-600">
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
                    {acc.purchaseDate && <span>Mua: {formatDate(acc.purchaseDate)}</span>}
                    {acc.expiryDate && (
                      <span className={isExpired(acc.expiryDate) ? 'text-red-600' : isExpiringSoon(acc.expiryDate) ? 'text-yellow-600' : ''}>
                        {isExpired(acc.expiryDate) && '⚠️'}{isExpiringSoon(acc.expiryDate) && '⏰'}
                        Hết hạn: {formatDate(acc.expiryDate)}
                      </span>
                    )}
                    {acc.note && <span className="truncate max-w-[150px]">📝 {acc.note}</span>}
                  </div>
                  
                  {(acc.soldTo || acc.soldToEmail) && (
                    <div className="text-xs text-slate-500 mb-2">
                      👤 {acc.soldTo?.name || acc.soldToEmail}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {(acc.status === 'available' || acc.status === 'disabled') && (
                      <button onClick={() => toggleAccountStatus(acc)} 
                        className={`px-2 py-1 rounded text-xs font-medium ${acc.status === 'available' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {acc.status === 'available' ? 'Vô hiệu' : 'Kích hoạt'}
                      </button>
                    )}
                    {acc.status !== 'sold' && (
                      <>
                        <button onClick={() => openModal(acc)} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Sửa</button>
                        <button onClick={() => handleDelete(acc._id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Xóa</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Thông tin tài khoản *
                </label>
                <textarea
                  value={form.credentials}
                  onChange={(e) => setForm({ ...form, credentials: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                  rows="3"
                  placeholder="Email: xxx@gmail.com&#10;Password: xxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="VD: Tài khoản mới..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ngày mua</label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hết bảo hành</label>
                  <input
                    type="date"
                    value={form.warrantyExpires}
                    onChange={(e) => setForm({ ...form, warrantyExpires: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">
                  Hủy
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center">
                  {submitting && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAccount ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Import nhiều tài khoản</h2>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <strong>Hướng dẫn:</strong> Mỗi dòng là 1 tài khoản. Có thể thêm ngày hết hạn (tùy chọn):
                <pre className="mt-2 bg-white p-2 rounded text-xs">
{`email1@gmail.com | pass123
email2@gmail.com | pass456 | 2025-12-31
email3@gmail.com | pass789 | 2025-06-30`}
                </pre>
                <p className="mt-2 text-xs">* Format ngày: YYYY-MM-DD (năm-tháng-ngày)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sản phẩm: <span className="text-purple-600">{currentProduct?.name}</span>
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                  rows="10"
                  placeholder="Nhập danh sách tài khoản, mỗi dòng 1 tài khoản..."
                />
                <p className="text-sm text-slate-500 mt-2">
                  Số tài khoản: {bulkText.split('\n').filter(l => l.trim()).length}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowBulkModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">
                  Hủy
                </button>
                <button onClick={handleBulkImport} disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center">
                  {submitting && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
