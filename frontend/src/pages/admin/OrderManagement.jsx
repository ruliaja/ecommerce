import React, { useState, useEffect } from 'react';
import { FiEye, FiX, FiCheckCircle, FiXCircle, FiZoomIn, FiFilter, FiSearch, FiArrowRight, FiCopy } from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import axiosInstance from '../../api/axiosInstance';
import { updateOrderStatus, getOrderDetail } from '../../api/orderService';
import { useNotification } from '../../context/NotificationContext';

const OrderManagement = () => {
  const { showConfirm } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [proofZoom, setProofZoom] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('?action=get_orders');
      if (response.data.status === 'success') {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    if (selectedOrders.length === 0) return;
    const { isConfirmed } = await showConfirm('Update Pesanan', `Update ${selectedOrders.length} pesanan menjadi ${status}?`, 'Ya, Update', 'Batal');
    if (isConfirmed) {
      setUpdating(true);
      try {
        await Promise.all(selectedOrders.map(id => updateOrderStatus(id, status.toLowerCase())));
        await fetchOrders();
        setSelectedOrders([]);
      } catch (error) {
        console.error('Error updating bulk orders:', error);
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleViewOrder = async (orderId) => {
    setViewOrder({ id: orderId, loading: true });
    try {
      const response = await getOrderDetail(orderId);
      if (response.status === 'success') {
        setViewOrder({ id: orderId, data: response.data, loading: false });
      } else {
        setViewOrder(null);
      }
    } catch (error) {
      setViewOrder(null);
    }
  };

  const handleConfirmPayment = async (orderId, action) => {
    let rejectionReason = null;
    const newStatus = action === 'approve' ? 'processing' : 'rejected';
    
    if (action === 'reject') {
      rejectionReason = window.prompt('Alasan penolakan (wajib):');
      if (!rejectionReason?.trim()) return;
    } else {
      const { isConfirmed } = await showConfirm('Setujui Pembayaran', 'Setujui pembayaran ini?', 'Ya, Setujui', 'Batal');
      if (!isConfirmed) return;
    }

    setConfirmingOrder(orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus, rejectionReason);
      if (res.status === 'success') {
        await fetchOrders();
        if (viewOrder?.id === orderId) {
          const updated = await getOrderDetail(orderId);
          if (updated.status === 'success') setViewOrder(prev => ({ ...prev, data: updated.data }));
        }
      }
    } finally {
      setConfirmingOrder(null);
    }
  };

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    const map = {
      'pending': 'bg-slate-100 text-slate-600 border-slate-200',
      'waiting_confirmation': 'bg-orange-100 text-orange-600 border-orange-200',
      'processing': 'bg-yellow-100 text-yellow-600 border-yellow-200',
      'shipped': 'bg-blue-100 text-blue-600 border-blue-200',
      'delivered': 'bg-green-100 text-green-600 border-green-200',
      'completed': 'bg-green-100 text-green-600 border-green-200',
      'cancel': 'bg-red-100 text-red-600 border-red-200',
      'rejected': 'bg-red-100 text-red-600 border-red-200',
    };
    return map[s] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    const map = {
      'pending': 'Unpaid',
      'waiting_confirmation': 'Waiting',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Completed',
      'completed': 'Completed',
      'cancel': 'Cancelled',
      'rejected': 'Rejected',
    };
    return map[s] || status;
  };

  const checkStatus = (status, tabId) => {
    const s = (status || '').toLowerCase();
    if (tabId === 'all') return true;
    if (tabId === 'unpaid') return s === 'pending';
    if (tabId === 'waiting') return s === 'waiting_confirmation';
    if (tabId === 'processing') return s === 'processing' || s === 'settlement';
    if (tabId === 'shipped') return s === 'shipped';
    if (tabId === 'completed') return s === 'delivered' || s === 'completed';
    if (tabId === 'cancelled') return s === 'cancel' || s === 'cancelled' || s === 'expire';
    if (tabId === 'rejected') return s === 'rejected';
    return true;
  };

  const tabs = [
    { id: 'all', label: 'Semua' },
    { id: 'unpaid', label: 'Belum Bayar' },
    { id: 'waiting', label: 'Konfirmasi' },
    { id: 'processing', label: 'Proses' },
    { id: 'shipped', label: 'Kirim' },
    { id: 'completed', label: 'Selesai' },
    { id: 'rejected', label: 'Ditolak' },
    { id: 'cancelled', label: 'Dibatalkan' }
  ];

  const filteredOrders = orders.filter(o => 
    checkStatus(o.status, activeTab) && 
    (o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
     o.customer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout currentPage="orders">
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border ${
                  activeTab === tab.id
                    ? 'bg-yellow-400 border-yellow-400 text-slate-900 shadow-md shadow-yellow-400/20'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 opacity-50">{orders.filter(o => checkStatus(o.status, tab.id)).length}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Pesanan / Pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none w-64 transition-all"
              />
            </div>
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <span className="text-[10px] font-black text-slate-400 uppercase mr-1">{selectedOrders.length} Dipilih</span>
                <button onClick={() => handleBulkUpdateStatus('Shipped')} className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-600 transition-colors">Kirim</button>
                <button onClick={() => handleBulkUpdateStatus('Delivered')} className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-green-600 transition-colors">Selesai</button>
                <button onClick={() => handleBulkUpdateStatus('Cancelled')} className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors">Batalkan</button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-yellow-400 focus:ring-yellow-400"
                      checked={orders.length > 0 && selectedOrders.length === orders.length}
                      onChange={(e) => setSelectedOrders(e.target.checked ? orders.map(o => o.id) : [])}
                    />
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Info</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Memuat data...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Tidak ada pesanan masuk</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className={`hover:bg-slate-50 transition-colors group ${selectedOrders.includes(order.id) ? 'bg-yellow-50/50' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-yellow-400 focus:ring-yellow-400"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => setSelectedOrders(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id])}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">{order.id}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{order.date}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{order.customer}</span>
                          <span className="text-[10px] text-slate-400">{order.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-black text-slate-800">{formatRupiah(order.amount)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${getStatusStyle(order.status)}`}>
                          {getStatusLabel(order.status)}
                          {order.payment_proof && <FiCheckCircle className="ml-1" size={10} />}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FiEye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {viewOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    Detail Pesanan <span className="text-slate-400">#{viewOrder.id}</span>
                  </h3>
                </div>
                <button onClick={() => setViewOrder(null)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all text-slate-400">
                  <FiX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                {viewOrder.loading ? (
                  <div className="py-12 text-center text-slate-400">Memuat detail...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Customer Info */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Info Pelanggan</p>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs font-black text-slate-800">{viewOrder.data.customer_name || 'Guest'}</p>
                          <p className="text-xs text-slate-500 mb-2">{viewOrder.data.customer_email || '-'}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{viewOrder.data.customer_address || 'Tidak ada alamat'}</p>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metode Pembayaran</p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const method = (viewOrder.data.payment_method || 'transfer').toLowerCase();
                            const ewalletStyle = { label: 'E-Wallet', icon: '📱', color: 'bg-purple-50 text-purple-700 border-purple-200' };
                            const labels = {
                              'transfer': { label: 'Transfer Bank', icon: '🏦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                              'bank_transfer': { label: 'Transfer Bank', icon: '🏦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                              'cod': { label: 'Bayar di Tempat (COD)', icon: '💵', color: 'bg-green-50 text-green-700 border-green-200' },
                              'ewallet': ewalletStyle,
                              'gopay': { ...ewalletStyle, label: 'GoPay' },
                              'dana': { ...ewalletStyle, label: 'DANA' },
                              'ovo': { ...ewalletStyle, label: 'OVO' },
                              'shopee': { ...ewalletStyle, label: 'ShopeePay' },
                              'shopeepay': { ...ewalletStyle, label: 'ShopeePay' },
                              'qris': { label: 'QRIS', icon: '📲', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                            };
                            const m = labels[method] || { label: viewOrder.data.payment_method || 'Transfer Bank', icon: '💳', color: 'bg-slate-50 text-slate-700 border-slate-200' };
                            return (
                              <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${m.color}`}>
                                <span>{m.icon}</span>
                                {m.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Payment Proof */}
                      {viewOrder.data.payment_proof && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                            Bukti Pembayaran
                            <span className="text-orange-500 lowercase font-bold">{getStatusLabel(viewOrder.data.status)}</span>
                          </p>
                          <div className="relative group rounded-2xl overflow-hidden border border-slate-100">
                            <img
                              src={viewOrder.data.payment_proof}
                              className="w-full h-40 object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                              onClick={() => setProofZoom(true)}
                              alt="Proof"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <FiZoomIn size={24} className="text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Items List */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Pesanan</p>
                        <div className="space-y-2">
                          {viewOrder.data.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                              <img src={item.image_url} className="w-10 h-10 object-cover rounded-lg" alt="" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-800 truncate">{item.product_name}</p>
                                <p className="text-[10px] font-bold text-slate-500">{item.quantity} x {formatRupiah(item.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="p-4 bg-yellow-400 rounded-2xl shadow-lg shadow-yellow-400/10">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Total Bayar</p>
                          <p className="text-xl font-black text-[#0f172a]">{formatRupiah(viewOrder.data.total_price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!viewOrder.loading && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 flex-wrap items-center">
                  
                  {viewOrder.data?.status === 'waiting_confirmation' && (
                    <>
                      <button
                        onClick={() => handleConfirmPayment(viewOrder.id, 'approve')}
                        className="flex-1 py-3 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                      >
                        Setujui Pembayaran
                      </button>
                      <button
                        onClick={() => handleConfirmPayment(viewOrder.id, 'reject')}
                        className="flex-1 py-3 border border-slate-200 bg-white text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition-all"
                      >
                        Tolak
                      </button>
                    </>
                  )}

                  {['processing', 'settlement'].includes((viewOrder.data?.status || '').toLowerCase()) && (
                    <button
                      onClick={async () => {
                        const { isConfirmed } = await showConfirm('Update Status', 'Ubah status menjadi Dikirim?', 'Ya', 'Batal');
                        if (isConfirmed) {
                          await updateOrderStatus(viewOrder.id, 'shipped');
                          fetchOrders();
                          const updated = await getOrderDetail(viewOrder.id);
                          if(updated.status === 'success') setViewOrder(prev => ({ ...prev, data: updated.data }));
                        }
                      }}
                      className="flex-1 py-3 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                      Kirim Pesanan
                    </button>
                  )}

                  {['shipped'].includes((viewOrder.data?.status || '').toLowerCase()) && (
                    <button
                      onClick={async () => {
                        const { isConfirmed } = await showConfirm('Selesaikan Pesanan', 'Selesaikan pesanan ini?', 'Ya', 'Batal');
                        if (isConfirmed) {
                          await updateOrderStatus(viewOrder.id, 'delivered');
                          fetchOrders();
                          const updated = await getOrderDetail(viewOrder.id);
                          if(updated.status === 'success') setViewOrder(prev => ({ ...prev, data: updated.data }));
                        }
                      }}
                      className="flex-1 py-3 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                    >
                      Pesanan Selesai
                    </button>
                  )}

                  {/* Cancel button appears for everything EXCEPT cancelled/rejected/shipped/delivered/completed */}
                  {!['cancelled', 'cancel', 'rejected', 'shipped', 'delivered', 'completed'].includes((viewOrder.data?.status || '').toLowerCase()) && (
                    <button
                      onClick={async () => {
                        const { isConfirmed } = await showConfirm('Batalkan Pesanan', 'Batalkan pesanan ini?', 'Ya, Batalkan', 'Batal');
                        if (isConfirmed) {
                          await updateOrderStatus(viewOrder.id, 'cancelled');
                          fetchOrders();
                          const updated = await getOrderDetail(viewOrder.id);
                          if(updated.status === 'success') setViewOrder(prev => ({ ...prev, data: updated.data }));
                        }
                      }}
                      className="px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all ml-auto"
                    >
                      Batalkan Pesanan
                    </button>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* Proof Zoom */}
        {proofZoom && viewOrder?.data?.payment_proof && (
          <div className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setProofZoom(false)}>
            <img src={viewOrder.data.payment_proof} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Full Proof" />
            <button className="absolute top-6 right-6 text-white p-3 hover:bg-white/10 rounded-full transition-all"><FiX size={24} /></button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrderManagement;
