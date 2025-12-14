import { useState, useEffect } from 'react';
import { FiEye, FiX, FiClock, FiCheckCircle, FiXCircle, FiSearch, FiLoader, FiCopy } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/admin/all');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
                       order.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                       order.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/orders/admin/${orderId}/status`, { status });
      
      // Cập nhật state
      setOrders(orders.map(o => o._id === orderId ? data : o));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(data);
      }
      
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  
  const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FiClock, label: 'Chờ thanh toán' },
      paid: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FiCheckCircle, label: 'Đã thanh toán' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheckCircle, label: 'Hoàn thành' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: FiXCircle, label: 'Đã hủy' }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-4 h-4 mr-1" /> {style.label}
      </span>
    );
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
        <h1 className="text-2xl font-bold text-slate-800">Quản lý đơn hàng</h1>
        <p className="text-slate-500">{orders.length} đơn hàng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Không có đơn hàng nào
          </div>
        ) : (
          <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mã đơn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden xl:table-cell">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-800 text-sm">{order.orderCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-sm">{order.user?.name || 'Khách'}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{order.user?.email || order.guestEmail || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-slate-600 text-sm">{order.items?.length || 0} sản phẩm</p>
                      <p className="text-xs text-slate-400 truncate max-w-[150px]">
                        {order.items?.map(i => i.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-purple-600 text-sm">{formatPrice(order.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-slate-600 text-sm">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredOrders.map(order => (
              <div key={order._id} className="p-4" onClick={() => setSelectedOrder(order)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-mono font-semibold text-slate-800 text-sm">{order.orderCode}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{order.user?.name || 'Khách'}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {order.items?.length || 0} sản phẩm • {formatDate(order.createdAt)}
                  </div>
                  <span className="font-bold text-purple-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Chi tiết đơn hàng</h2>
                <p className="text-slate-500 font-mono">{selectedOrder.orderCode}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Khách hàng</p>
                  <p className="font-semibold text-slate-800">{selectedOrder.user?.name || 'Khách vãng lai'}</p>
                  <p className="text-slate-600">{selectedOrder.user?.email || selectedOrder.guestEmail || 'N/A'}</p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Products */}
              <div>
                <p className="text-sm text-slate-500 mb-3">Sản phẩm</p>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-500">x{item.quantity} × {formatPrice(item.price)}</p>
                        </div>
                        <span className="font-semibold text-purple-600">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      
                      {/* Account Data (nếu đã thanh toán) */}
                      {item.accountData && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-green-700">Thông tin tài khoản:</span>
                            <button 
                              onClick={() => copyToClipboard(item.accountData)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                          <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono bg-white p-2 rounded">
                            {item.accountData}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">Tổng cộng</span>
                  <span className="text-xl font-bold text-purple-600">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <p className="text-sm text-slate-500 mb-3">Cập nhật trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'paid', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedOrder._id, status)}
                      disabled={selectedOrder.status === status || updating}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${
                        selectedOrder.status === status
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'pending' && 'Chờ thanh toán'}
                      {status === 'paid' && 'Đã thanh toán'}
                      {status === 'completed' && 'Hoàn thành'}
                      {status === 'cancelled' && 'Hủy đơn'}
                    </button>
                  ))}
                </div>
                {selectedOrder.status === 'pending' && (
                  <p className="text-sm text-blue-600 mt-2">
                    💡 Khi chuyển sang "Đã thanh toán", hệ thống sẽ tự động gán tài khoản cho đơn hàng.
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="text-sm text-slate-500 space-y-1">
                <p>Ngày tạo: {formatDate(selectedOrder.createdAt)}</p>
                {selectedOrder.paidAt && <p>Ngày thanh toán: {formatDate(selectedOrder.paidAt)}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
