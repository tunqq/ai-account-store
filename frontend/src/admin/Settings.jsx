import { useState } from 'react';
import { FiTrash2, FiAlertTriangle, FiLoader, FiDatabase, FiShoppingBag, FiPackage, FiUsers, FiKey, FiDollarSign, FiGrid } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [loading, setLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const deleteActions = [
    { 
      id: 'orders', 
      label: 'Xóa tất cả đơn hàng', 
      icon: FiShoppingBag, 
      color: 'blue',
      description: 'Xóa toàn bộ đơn hàng trong hệ thống',
      confirmWord: 'XOA DON HANG'
    },
    { 
      id: 'accounts', 
      label: 'Xóa tất cả tài khoản (kho)', 
      icon: FiKey, 
      color: 'pink',
      description: 'Xóa toàn bộ tài khoản trong kho (không phải user)',
      confirmWord: 'XOA TAI KHOAN'
    },
    { 
      id: 'products', 
      label: 'Xóa tất cả sản phẩm', 
      icon: FiPackage, 
      color: 'purple',
      description: 'Xóa toàn bộ sản phẩm và tài khoản liên quan',
      confirmWord: 'XOA SAN PHAM'
    },
    { 
      id: 'categories', 
      label: 'Xóa tất cả danh mục', 
      icon: FiGrid, 
      color: 'green',
      description: 'Xóa toàn bộ danh mục sản phẩm',
      confirmWord: 'XOA DANH MUC'
    },
    { 
      id: 'users', 
      label: 'Xóa tất cả người dùng (trừ admin)', 
      icon: FiUsers, 
      color: 'orange',
      description: 'Xóa toàn bộ người dùng, giữ lại tài khoản admin',
      confirmWord: 'XOA NGUOI DUNG'
    },
    { 
      id: 'transactions', 
      label: 'Xóa lịch sử giao dịch', 
      icon: FiDollarSign, 
      color: 'emerald',
      description: 'Xóa toàn bộ lịch sử nạp xu và giao dịch',
      confirmWord: 'XOA GIAO DICH'
    },
    { 
      id: 'all', 
      label: '⚠️ XÓA TOÀN BỘ DỮ LIỆU', 
      icon: FiDatabase, 
      color: 'red',
      description: 'Reset toàn bộ database về trạng thái ban đầu (giữ admin)',
      confirmWord: 'XOA TAT CA'
    },
  ];

  const handleDelete = async (actionId) => {
    const action = deleteActions.find(a => a.id === actionId);
    if (confirmText !== action.confirmWord) {
      toast.error(`Vui lòng nhập "${action.confirmWord}" để xác nhận`);
      return;
    }

    setLoading(prev => ({ ...prev, [actionId]: true }));
    try {
      const { data } = await api.delete(`/admin/clear/${actionId}`);
      toast.success(data.message || 'Đã xóa thành công!');
      setConfirmModal(null);
      setConfirmText('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
      pink: 'bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-200',
      purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
      green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
      orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200',
      emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200',
      red: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cài đặt hệ thống</h1>
        <p className="text-slate-500">Quản lý và bảo trì dữ liệu</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <FiAlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-800">Cảnh báo: Khu vực nguy hiểm</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Các thao tác dưới đây sẽ xóa vĩnh viễn dữ liệu và không thể khôi phục. 
            Chỉ sử dụng khi đang test hoặc cần reset hệ thống.
          </p>
        </div>
      </div>

      {/* Delete Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FiTrash2 className="w-5 h-5 text-red-500" />
          Xóa dữ liệu (Test Mode)
        </h2>
        
        <div className="grid gap-3">
          {deleteActions.map(action => (
            <button
              key={action.id}
              onClick={() => { setConfirmModal(action); setConfirmText(''); }}
              disabled={loading[action.id]}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${getColorClasses(action.color)}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                action.color === 'red' ? 'bg-red-100' : 'bg-white'
              }`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
              {loading[action.id] && <FiLoader className="w-5 h-5 animate-spin" />}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <FiAlertTriangle className="w-6 h-6" />
                <h2 className="text-xl font-bold">Xác nhận xóa</h2>
              </div>
              <p className="text-slate-600">{confirmModal.description}</p>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-3">
                Nhập <span className="font-bold text-red-600">{confirmModal.confirmWord}</span> để xác nhận:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={confirmModal.confirmWord}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono"
                autoFocus
              />
            </div>
            
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => { setConfirmModal(null); setConfirmText(''); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmModal.id)}
                disabled={loading[confirmModal.id] || confirmText !== confirmModal.confirmWord}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading[confirmModal.id] ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <FiTrash2 className="w-5 h-5" />
                )}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
