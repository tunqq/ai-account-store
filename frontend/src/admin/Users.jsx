import { useState, useEffect } from 'react';
import { FiShield, FiSearch, FiMail, FiCalendar, FiLoader, FiLock, FiUnlock, FiTrash2, FiUserCheck, FiUserX, FiKey, FiEye, FiX, FiShoppingBag, FiAlertTriangle, FiClock, FiCopy, FiPhone } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, admins: 0, customers: 0, active: 0, locked: 0 });
  const [actionLoading, setActionLoading] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
      
      // Tính stats
      const admins = data.filter(u => u.role === 'admin').length;
      const locked = data.filter(u => u.isActive === false).length;
      setStats({
        total: data.length,
        admins,
        customers: data.length - admins,
        active: data.length - locked,
        locked
      });
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    setActionLoading(userId);
    try {
      const { data } = await api.put(`/auth/users/${userId}/toggle-status`);
      toast.success(data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
      setShowMenu(null);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${userName}"?\n\nHành động này không thể hoàn tác!`)) return;
    
    setActionLoading(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('Đã xóa người dùng');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
    } finally {
      setActionLoading(null);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    setActionLoading(showResetModal._id);
    try {
      const { data } = await api.post(`/auth/users/${showResetModal._id}/reset-password`, { newPassword });
      toast.success(data.message);
      setShowResetModal(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
  );

  const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const viewUserDetails = async (user) => {
    setShowDetailModal(user);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/auth/users/${user._id}/details`);
      setUserDetails(data);
    } catch (error) {
      toast.error('Không thể tải thông tin chi tiết');
      setShowDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép');
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
        <p className="text-slate-500">{users.length} người dùng</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-sm text-slate-500">Tổng người dùng</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          <p className="text-sm text-slate-500">Admin</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
          <p className="text-sm text-slate-500">Khách hàng</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-slate-500">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-2xl font-bold text-red-600">{stats.locked}</p>
          <p className="text-sm text-slate-500">Đã khóa</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Không có người dùng nào
          </div>
        ) : (
          <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden xl:table-cell">SĐT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Số dư</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden 2xl:table-cell">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user._id} className={`hover:bg-slate-50 transition-colors ${user.isActive === false ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          user.isActive === false 
                            ? 'bg-gradient-to-br from-red-400 to-red-500'
                            : user.role === 'admin' 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                              : 'bg-gradient-to-br from-slate-400 to-slate-500'
                        }`}>
                          <span className="text-white font-bold text-sm">{user.name?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 text-sm block truncate">{user.name}</span>
                          <span className="text-xs text-slate-500 lg:hidden truncate block">{user.email}</span>
                          {user.isActive === false && (
                            <span className="text-xs text-red-500">🔒</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center text-slate-600 text-sm">
                        <FiMail className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center text-slate-600 text-sm">
                        <FiPhone className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span>{user.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' && <FiShield className="w-3 h-3 mr-1" />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive === false
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.isActive === false ? (
                          <><FiUserX className="w-3 h-3 mr-1" /> Khóa</>
                        ) : (
                          <><FiUserCheck className="w-3 h-3 mr-1" /> OK</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-purple-600 text-sm">
                        {new Intl.NumberFormat('vi-VN').format(user.balance || 0)}đ
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center text-slate-600 text-sm">
                        <FiCalendar className="w-3 h-3 mr-1 text-slate-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' ? (
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => viewUserDetails(user)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setShowResetModal(user); setNewPassword(''); }}
                            disabled={actionLoading === user._id}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            <FiKey className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user._id)}
                            disabled={actionLoading === user._id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isActive === false
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={user.isActive === false ? 'Mở khóa' : 'Khóa'}
                          >
                            {actionLoading === user._id ? (
                              <FiLoader className="w-4 h-4 animate-spin" />
                            ) : user.isActive === false ? (
                              <FiUnlock className="w-4 h-4" />
                            ) : (
                              <FiLock className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteUser(user._id, user.name)}
                            disabled={actionLoading === user._id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Không thể thao tác</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <div key={user._id} className={`p-4 ${user.isActive === false ? 'bg-red-50/50' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      user.isActive === false 
                        ? 'bg-gradient-to-br from-red-400 to-red-500'
                        : user.role === 'admin' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}>
                      <span className="text-white font-bold text-sm">{user.name?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.phone && <p className="text-xs text-slate-400 flex items-center gap-1"><FiPhone className="w-3 h-3" />{user.phone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role === 'admin' && <FiShield className="w-3 h-3 mr-1" />}
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.isActive === false ? 'Khóa' : 'OK'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-medium text-purple-600">
                    {new Intl.NumberFormat('vi-VN').format(user.balance || 0)}đ
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />
                    {formatDate(user.createdAt)}
                  </span>
                </div>
                
                {user.role !== 'admin' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FiEye className="w-3 h-3" /> Chi tiết
                    </button>
                    <button
                      onClick={() => { setShowResetModal(user); setNewPassword(''); }}
                      disabled={actionLoading === user._id}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FiKey className="w-3 h-3" /> Đổi MK
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user._id)}
                      disabled={actionLoading === user._id}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                        user.isActive === false
                          ? 'bg-green-50 text-green-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {actionLoading === user._id ? (
                        <FiLoader className="w-3 h-3 animate-spin" />
                      ) : user.isActive === false ? (
                        <FiUnlock className="w-3 h-3" />
                      ) : (
                        <FiLock className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteUser(user._id, user.name)}
                      disabled={actionLoading === user._id}
                      className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-medium"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Đặt lại mật khẩu</h2>
              <p className="text-sm text-slate-500 mt-1">
                Đặt mật khẩu mới cho <span className="font-medium text-purple-600">{showResetModal.name}</span>
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu mới
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                * Mật khẩu sẽ được lưu dạng mã hóa. Hãy gửi mật khẩu mới cho người dùng.
              </p>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => { setShowResetModal(null); setNewPassword(''); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={resetPassword}
                disabled={actionLoading === showResetModal._id || !newPassword}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === showResetModal._id ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <FiKey className="w-5 h-5" />
                )}
                Đặt lại mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  showDetailModal.isActive === false 
                    ? 'bg-gradient-to-br from-red-400 to-red-500'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  <span className="text-white font-bold text-lg">{showDetailModal.name?.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{showDetailModal.name}</h2>
                  <p className="text-sm text-slate-500">{showDetailModal.email}</p>
                </div>
              </div>
              <button onClick={() => { setShowDetailModal(null); setUserDetails(null); }} className="p-2 hover:bg-slate-100 rounded-xl">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{userDetails.stats.totalOrders}</p>
                      <p className="text-xs text-purple-600">Đơn hàng</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{userDetails.stats.totalAccounts}</p>
                      <p className="text-xs text-green-600">Tài khoản</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-blue-600">{new Intl.NumberFormat('vi-VN').format(userDetails.stats.totalSpent)}đ</p>
                      <p className="text-xs text-blue-600">Đã chi tiêu</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-slate-600">{new Intl.NumberFormat('vi-VN').format(userDetails.user.balance || 0)}đ</p>
                      <p className="text-xs text-slate-600">Số dư</p>
                    </div>
                  </div>

                  {/* Warnings */}
                  {(userDetails.stats.expiredAccounts > 0 || userDetails.stats.expiringSoonAccounts > 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">Cảnh báo tài khoản</p>
                          <div className="text-sm text-yellow-700 mt-1 space-y-1">
                            {userDetails.stats.expiredAccounts > 0 && (
                              <p>⚠️ {userDetails.stats.expiredAccounts} tài khoản đã hết hạn</p>
                            )}
                            {userDetails.stats.expiringSoonAccounts > 0 && (
                              <p>⏰ {userDetails.stats.expiringSoonAccounts} tài khoản sắp hết hạn (trong 7 ngày)</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Accounts */}
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <FiKey className="w-4 h-4" /> Tài khoản đã mua ({userDetails.accounts.length})
                    </h3>
                    {userDetails.accounts.length === 0 ? (
                      <p className="text-slate-500 text-sm">Chưa mua tài khoản nào</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userDetails.accounts.map(acc => (
                          <div key={acc._id} className={`p-3 rounded-xl border ${
                            acc.isExpired ? 'bg-red-50 border-red-200' : 
                            acc.isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 
                            'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                {acc.product?.image ? (
                                  <img src={acc.product.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{acc.product?.name?.charAt(0)}</span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">{acc.product?.name || 'N/A'}</p>
                                  <p className="text-xs text-slate-500">{formatDate(acc.soldAt)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {acc.isExpired && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Hết hạn</span>}
                                {acc.isExpiringSoon && !acc.isExpired && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Sắp hết hạn</span>}
                                <button onClick={() => copyToClipboard(acc.credentials)} className="p-1 text-slate-400 hover:text-purple-600">
                                  <FiCopy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <code className="block bg-white px-2 py-1 rounded text-xs text-slate-700 whitespace-pre-wrap break-all">
                              {acc.credentials}
                            </code>
                            {acc.expiryDate && (
                              <p className={`text-xs mt-1 flex items-center gap-1 ${acc.isExpired ? 'text-red-600' : acc.isExpiringSoon ? 'text-yellow-600' : 'text-slate-500'}`}>
                                <FiClock className="w-3 h-3" />
                                Hết hạn: {formatDate(acc.expiryDate)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Orders */}
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <FiShoppingBag className="w-4 h-4" /> Đơn hàng gần đây ({userDetails.orders.length})
                    </h3>
                    {userDetails.orders.length === 0 ? (
                      <p className="text-slate-500 text-sm">Chưa có đơn hàng nào</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userDetails.orders.slice(0, 10).map(order => (
                          <div key={order._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-mono text-sm font-medium text-slate-800">{order.orderCode}</p>
                              <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-purple-600 text-sm">{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.status === 'completed' || order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {order.status === 'completed' ? 'Hoàn thành' : order.status === 'paid' ? 'Đã TT' : order.status === 'pending' ? 'Chờ TT' : 'Đã hủy'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => { setShowDetailModal(null); setUserDetails(null); }}
                className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
