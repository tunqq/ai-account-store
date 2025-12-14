import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faPlus, faHistory, faCoins, faQrcode, faCopy, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function Wallet() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositInfo, setDepositInfo] = useState(null);
  const [depositing, setDepositing] = useState(false);
  const [copied, setCopied] = useState(false);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Fetch wallet error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount < 10000) {
      alert('Số tiền nạp tối thiểu là 10,000đ');
      return;
    }

    setDepositing(true);
    try {
      const { data } = await api.post('/wallet/deposit/request', { amount });
      setDepositInfo(data);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDepositing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: { text: 'Nạp xu', color: 'text-green-600 bg-green-100' },
      purchase: { text: 'Mua hàng', color: 'text-red-600 bg-red-100' },
      refund: { text: 'Hoàn xu', color: 'text-blue-600 bg-blue-100' },
      bonus: { text: 'Khuyến mãi', color: 'text-purple-600 bg-purple-100' },
      admin_adjust: { text: 'Điều chỉnh', color: 'text-orange-600 bg-orange-100' }
    };
    return labels[type] || { text: type, color: 'text-gray-600 bg-gray-100' };
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: 'Chờ xử lý', color: 'text-yellow-600' },
      completed: { text: 'Hoàn thành', color: 'text-green-600' },
      failed: { text: 'Thất bại', color: 'text-red-600' },
      cancelled: { text: 'Đã hủy', color: 'text-gray-600' }
    };
    return labels[status] || { text: status, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-2xl shadow-purple-500/30 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-purple-200 text-xs sm:text-sm mb-1">Số dư hiện tại</p>
              <h1 className="text-2xl sm:text-4xl font-bold flex items-center gap-2 sm:gap-3">
                <FontAwesomeIcon icon={faCoins} className="text-yellow-300 w-6 h-6 sm:w-8 sm:h-8" />
                {balance.toLocaleString('vi-VN')}đ
              </h1>
              <p className="text-purple-200 mt-1 sm:mt-2 text-xs sm:text-base truncate">{user?.name} • {user?.email}</p>
            </div>
            <button
              onClick={() => { setShowDeposit(true); setDepositInfo(null); setDepositAmount(''); }}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FontAwesomeIcon icon={faPlus} />
              Nạp xu
            </button>
          </div>
        </div>

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Nạp xu vào tài khoản</h2>
              </div>

              {!depositInfo ? (
                <div className="p-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số tiền muốn nạp
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount.toString())}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          depositAmount === amount.toString()
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-purple-100'
                        }`}
                      >
                        {amount.toLocaleString('vi-VN')}đ
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    * Tối thiểu 10,000đ - Tối đa 10,000,000đ
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowDeposit(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={depositing}
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {depositing ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faQrcode} />
                      )}
                      Tạo mã QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-slate-600 mb-2">Quét mã QR để thanh toán</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {depositInfo.payment.amount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <img
                      src={depositInfo.payment.qrUrl}
                      alt="QR Code"
                      className="w-64 h-64 rounded-xl border-4 border-purple-100"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Ngân hàng</span>
                      <span className="font-medium">MB Bank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Số tài khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{depositInfo.payment.accountNo}</span>
                        <button onClick={() => copyToClipboard(depositInfo.payment.accountNo)} className="text-purple-600">
                          <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Chủ tài khoản</span>
                      <span className="font-medium">{depositInfo.payment.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Nội dung CK</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-600">{depositInfo.payment.content}</span>
                        <button onClick={() => copyToClipboard(depositInfo.payment.content)} className="text-purple-600">
                          <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-500 mt-4">
                    ⚠️ Vui lòng chuyển đúng nội dung để được cộng xu tự động
                  </p>

                  <button
                    onClick={() => { setShowDeposit(false); fetchWalletData(); }}
                    className="w-full mt-6 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                  >
                    Đã chuyển khoản
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faHistory} className="text-purple-500 w-4 h-4 sm:w-5 sm:h-5" />
              Lịch sử giao dịch
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <FontAwesomeIcon icon={faWallet} className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-sm sm:text-base">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map(tx => {
                const typeInfo = getTypeLabel(tx.type);
                const statusInfo = getStatusLabel(tx.status);
                const isCancelled = tx.status === 'cancelled' || tx.status === 'failed';
                const isPending = tx.status === 'pending';
                
                return (
                  <div key={tx._id} className={`p-3 sm:p-4 hover:bg-slate-50 transition-colors ${isCancelled ? 'opacity-60' : ''}`}>
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-gray-100 text-gray-500' : typeInfo.color}`}>
                          <FontAwesomeIcon icon={faCoins} className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm sm:text-base truncate ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {tx.description}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500">
                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            <span className={`ml-1 sm:ml-2 ${statusInfo.color}`}>• {statusInfo.text}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm sm:text-base ${
                          isCancelled ? 'text-gray-400 line-through' : 
                          isPending ? 'text-yellow-600' :
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          Số dư: {(tx.balanceAfter || 0).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
