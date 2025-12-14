import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faCheck, faTimes, faCoins, faSpinner, faPlus, faMinus, faGift, faSearch } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminWallet() {
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjustType, setAdjustType] = useState('bonus');
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [depositsRes, transactionsRes, usersRes] = await Promise.all([
        api.get('/wallet/admin/pending-deposits'),
        api.get('/wallet/admin/transactions?limit=50'),
        api.get('/auth/users')
      ]);
      setPendingDeposits(depositsRes.data);
      setTransactions(transactionsRes.data.transactions);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeposit = async (id) => {
    if (!confirm('Xác nhận nạp xu cho người dùng này?')) return;
    try {
      const { data } = await api.post(`/wallet/admin/confirm-deposit/${id}`);
      toast.success(data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi xác nhận');
    }
  };

  const rejectDeposit = async (id) => {
    const reason = prompt('Lý do từ chối:');
    if (reason === null) return;
    try {
      const { data } = await api.post(`/wallet/admin/reject-deposit/${id}`, { reason });
      toast.success(data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi từ chối');
    }
  };

  const handleAdjust = async () => {
    if (!selectedUser || !adjustAmount) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Số xu không hợp lệ');
      return;
    }

    try {
      const endpoint = adjustType === 'bonus' ? '/wallet/admin/bonus' : '/wallet/admin/adjust-balance';
      const { data } = await api.post(endpoint, {
        userId: selectedUser._id,
        amount: adjustType === 'subtract' ? -Math.abs(amount) : Math.abs(amount),
        description: adjustDescription
      });
      toast.success(data.message);
      setShowAdjustModal(false);
      setSelectedUser(null);
      setAdjustAmount('');
      setAdjustDescription('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi điều chỉnh');
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: { text: 'Nạp xu', color: 'bg-green-100 text-green-600' },
      purchase: { text: 'Mua hàng', color: 'bg-red-100 text-red-600' },
      refund: { text: 'Hoàn xu', color: 'bg-blue-100 text-blue-600' },
      bonus: { text: 'Khuyến mãi', color: 'bg-purple-100 text-purple-600' },
      admin_adjust: { text: 'Điều chỉnh', color: 'bg-orange-100 text-orange-600' }
    };
    return labels[type] || { text: type, color: 'bg-gray-100 text-gray-600' };
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FontAwesomeIcon icon={faWallet} className="text-purple-500" />
          Quản lý Ví xu
        </h1>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faGift} />
          Tặng/Điều chỉnh xu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-600 text-sm">Chờ xác nhận</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingDeposits.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-600 text-sm">Tổng nạp hôm nay</p>
          <p className="text-2xl font-bold text-green-700">
            {transactions
              .filter(t => t.type === 'deposit' && t.status === 'completed' && 
                new Date(t.createdAt).toDateString() === new Date().toDateString())
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-purple-600 text-sm">Tổng xu khuyến mãi</p>
          <p className="text-2xl font-bold text-purple-700">
            {transactions
              .filter(t => t.type === 'bonus' && t.status === 'completed')
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Chờ xác nhận ({pendingDeposits.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Lịch sử giao dịch
        </button>
      </div>

      {/* Pending Deposits */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {pendingDeposits.length === 0 ? (
            <div className="p-12 text-center">
              <FontAwesomeIcon icon={faCoins} className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Không có yêu cầu nạp xu nào</p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Người dùng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Số tiền</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Mã nạp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Thời gian</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingDeposits.map(deposit => (
                    <tr key={deposit._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{deposit.user?.name}</p>
                        <p className="text-xs text-slate-500">{deposit.user?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-green-600">
                          +{deposit.amount.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {deposit.paymentInfo?.content}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(deposit.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => confirmDeposit(deposit._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg mr-1"
                          title="Xác nhận"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button
                          onClick={() => rejectDeposit(deposit._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Từ chối"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {pendingDeposits.map(deposit => (
                <div key={deposit._id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-slate-800">{deposit.user?.name}</p>
                      <p className="text-xs text-slate-500">{deposit.user?.email}</p>
                    </div>
                    <span className="font-bold text-green-600 text-lg">
                      +{deposit.amount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <code className="bg-slate-100 px-2 py-1 rounded">
                      {deposit.paymentInfo?.content}
                    </code>
                    <span>{new Date(deposit.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmDeposit(deposit._id)}
                      className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faCheck} /> Xác nhận
                    </button>
                    <button
                      onClick={() => rejectDeposit(deposit._id)}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTimes} /> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* Transaction History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Số tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Mô tả</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => {
                  const typeInfo = getTypeLabel(tx.type);
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{tx.user?.name}</p>
                        <p className="text-xs text-slate-500">{tx.user?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {transactions.map(tx => {
              const typeInfo = getTypeLabel(tx.type);
              return (
                <div key={tx._id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{tx.user?.name}</p>
                      <p className="text-xs text-slate-500">{tx.user?.email}</p>
                    </div>
                    <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.text}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {tx.description && (
                    <p className="text-xs text-slate-500 mt-2 truncate">{tx.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Tặng/Điều chỉnh xu</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Search User */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn người dùng</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                  <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {searchUser && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                    {filteredUsers.slice(0, 5).map(u => (
                      <button
                        key={u._id}
                        onClick={() => { setSelectedUser(u); setSearchUser(''); }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        <span className="text-xs text-purple-600">{(u.balance || 0).toLocaleString('vi-VN')}đ</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-purple-800">{selectedUser.name}</p>
                      <p className="text-xs text-purple-600">Số dư: {(selectedUser.balance || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-purple-600 hover:text-purple-800">
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Loại điều chỉnh</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustType('bonus')}
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      adjustType === 'bonus' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faGift} /> Tặng xu
                  </button>
                  <button
                    onClick={() => setAdjustType('add')}
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      adjustType === 'add' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Cộng xu
                  </button>
                  <button
                    onClick={() => setAdjustType('subtract')}
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      adjustType === 'subtract' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faMinus} /> Trừ xu
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số xu</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Nhập số xu..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú</label>
                <input
                  type="text"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="Lý do điều chỉnh..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAdjust}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
