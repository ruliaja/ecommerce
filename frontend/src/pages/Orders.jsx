import React, { useState, useEffect } from 'react';
import {
  FiArrowLeft, FiPackage, FiTruck, FiCheck, FiClock, FiX,
  FiChevronDown, FiUpload, FiImage, FiAlertCircle, FiStar
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import UserProfileLayout from '../layouts/UserProfileLayout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getOrders, updateOrderStatus } from '../api/orderService';
import { submitReview, checkUserReview } from '../api/reviewService';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewModal, setReviewModal] = useState(null); // { orderId, productId, productName }
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedItems, setReviewedItems] = useState({}); // key: `${orderId}_${productId}`

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      if (response.status === 'success') {
        const ordersList = Array.isArray(response.data) ? response.data : [];
        setOrders(ordersList.length > 0 ? sortOrders(ordersList) : []);
      } else {
        showError(response.message || 'Gagal memuat pesanan');
      }
    } catch (error) {
      showError(error.message || 'Terjadi kesalahan saat memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const { isConfirmed } = await showConfirm('Batalkan Pesanan', 'Apakah Anda yakin ingin membatalkan pesanan ini?', 'Ya, Batalkan', 'Kembali');
    if (isConfirmed) {
      try {
        const response = await updateOrderStatus(orderId, 'cancelled');
        if (response.status === 'success') {
          showSuccess('Pesanan berhasil dibatalkan');
          loadOrders();
        } else {
          showError(response.message || 'Gagal membatalkan pesanan');
        }
      } catch (error) {
        showError('Terjadi kesalahan saat membatalkan pesanan');
      }
    }
  };

  const handleReceiveOrder = async (orderId) => {
    const { isConfirmed } = await showConfirm('Pesanan Diterima', 'Apakah Anda yakin telah menerima pesanan ini dengan baik?', 'Ya, Sudah Diterima', 'Kembali');
    if (isConfirmed) {
      try {
        const response = await updateOrderStatus(orderId, 'completed');
        if (response.status === 'success') {
          showSuccess('Status pesanan berhasil diperbarui menjadi Diterima');
          loadOrders();
        } else {
          showError(response.message || 'Gagal memperbarui status pesanan');
        }
      } catch (error) {
        showError('Terjadi kesalahan saat memperbarui status pesanan');
      }
    }
  };


  const sortOrders = (ordersList) => {
    return ordersList.sort((a, b) => {
      const incompleteStatuses = ['pending', 'waiting_confirmation', 'processing', 'shipped', 'settlement', ''];
      const aIsIncomplete = incompleteStatuses.includes((a.status || 'pending').toLowerCase());
      const bIsIncomplete = incompleteStatuses.includes((b.status || 'pending').toLowerCase());
      if (aIsIncomplete !== bIsIncomplete) return aIsIncomplete ? -1 : 1;
      const dateA = new Date(a.created_at || a.order_date || 0);
      const dateB = new Date(b.created_at || b.order_date || 0);
      return dateB - dateA;
    });
  };

  const getStatusIcon = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'waiting_confirmation') return <FiUpload className="text-orange-500" size={20} />;
    switch (s) {
      case 'pending': case '': return <FiClock className="text-yellow-500" size={20} />;
      case 'processing': case 'settlement': return <FiPackage className="text-blue-500" size={20} />;
      case 'shipped': return <FiTruck className="text-purple-500" size={20} />;
      case 'delivered': case 'completed': return <FiCheck className="text-green-500" size={20} />;
      case 'cancelled': case 'cancel': return <FiX className="text-red-500" size={20} />;
      case 'expire': return <FiX className="text-gray-500" size={20} />;
      default: return <FiPackage className="text-gray-500" size={20} />;
    }
  };

  const getStatusLabel = (status) => {
    const s = (status || 'pending').toLowerCase();
    const labels = {
      'pending': 'Menunggu Pembayaran',
      '': 'Menunggu Pembayaran',
      'waiting_confirmation': 'Menunggu Konfirmasi',
      'processing': 'Diproses',
      'settlement': 'Diproses',
      'shipped': 'Dalam Pengiriman',
      'delivered': 'Tiba',
      'completed': 'Tiba',
      'cancelled': 'Dibatalkan',
      'cancel': 'Dibatalkan',
      'expire': 'Kedaluwarsa'
    };
    return labels[s] || status;
  };

  const getStatusColor = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'pending': case '': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'waiting_confirmation': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'processing': case 'settlement': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'delivered': case 'completed': return 'bg-green-50 text-green-800 border-green-200';
      case 'cancelled': case 'cancel': return 'bg-red-50 text-red-800 border-red-200';
      case 'expire': return 'bg-gray-50 text-gray-800 border-gray-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  // Fix malformed payment proof URLs from older uploads
  const fixProofUrl = (url) => {
    if (!url) return url;
    return url.replace('/api/index.php/', '/').replace('/api/', '/');
  };

  const toggleOrderExpand = (orderId) =>
    setExpandedOrder(expandedOrder === orderId ? null : orderId);

  const isPendingPayment = (status) => (status || '').toLowerCase() === 'pending' || status === '';
  const isWaitingConfirmation = (status) => (status || '').toLowerCase() === 'waiting_confirmation';

  const tabs = [
    { id: 'all', label: 'Semua' },
    { id: 'unpaid', label: 'Belum Bayar' },
    { id: 'waiting', label: 'Menunggu Konfirmasi' },
    { id: 'processing', label: 'Diproses' },
    { id: 'shipped', label: 'Dikirim' },
    { id: 'completed', label: 'Selesai' },
    { id: 'cancelled', label: 'Dibatalkan' }
  ];

  const checkStatus = (status, tabId) => {
    const s = (status || 'pending').toLowerCase();
    switch (tabId) {
      case 'all': return true;
      case 'unpaid': return s === 'pending' || s === '';
      case 'waiting': return s === 'waiting_confirmation';
      case 'processing': return s === 'processing' || s === 'settlement';
      case 'shipped': return s === 'shipped';
      case 'completed': return s === 'delivered' || s === 'completed';
      case 'cancelled': return s === 'cancelled' || s === 'cancel' || s === 'expire';
      default: return true;
    }
  };

  const getFilteredOrders = () => orders.filter(order => checkStatus(order.status, activeTab));
  const getTabCount = (tabId) => orders.filter(order => checkStatus(order.status, tabId)).length;

  const filteredOrders = getFilteredOrders();

  return (
    <UserProfileLayout currentPage="orders">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition font-medium text-sm mb-3">
            <FiArrowLeft size={18} /> Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Pesanan Saya</h1>
          <p className="text-sm text-gray-600">Pantau riwayat dan status pesanan Anda</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto flex-nowrap gap-2 mb-6 pb-2 scrollbar-thin">
          {tabs.map(tab => {
            const count = getTabCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FiPackage size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Pesanan</h2>
            <p className="text-gray-600 mb-6">Tidak ada pesanan di kategori ini.</p>
            {activeTab === 'all' && (
              <button onClick={() => navigate('/products')} className="px-6 py-2 bg-blue-500 text-white font-medium text-sm rounded-lg hover:bg-blue-600 transition">
                Mulai Belanja
              </button>
            )}
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md">
                {/* Order Header */}
                <button
                  onClick={() => toggleOrderExpand(order.id)}
                  className="w-full p-4 sm:px-6 sm:py-4 hover:bg-gray-50 transition flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 text-left">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">{getStatusIcon(order.status)}</div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                          Pesanan #{order.order_number || order.id}
                        </p>
                        <span className={`w-fit px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
                        {formatDate(order.created_at || order.order_date)}
                      </p>
                      <div className="flex sm:hidden items-center justify-between w-full mt-1">
                         <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total_price || order.total_amount)}</p>
                         <p className="text-xs text-gray-500">{order.items?.length || order.quantity || 1} item</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                      <p className="font-bold text-gray-900 text-base">{formatCurrency(order.total_price || order.total_amount)}</p>
                      <p className="text-xs text-gray-600">{order.items?.length || order.quantity || 1} item</p>
                    </div>
                  </div>
                  <FiChevronDown
                    size={20}
                    className={`ml-2 sm:ml-4 text-gray-400 transition-transform shrink-0 mt-1 sm:mt-0 ${expandedOrder === order.id ? 'transform rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded Detail */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 space-y-4">

                    {/* ═══ PENDING: Status info — upload via OrderSuccess ═══ */}
                    {isPendingPayment(order.status) && (
                      <div className="rounded-xl overflow-hidden border border-yellow-200 shadow-sm">
                        <div className={`px-4 py-3 flex items-center gap-2 ${order.rejection_reason ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-500 to-amber-500'}`}>
                          <FiAlertCircle className="text-white" size={18} />
                          <p className="text-white font-semibold text-sm">
                            {order.rejection_reason ? 'Pembayaran Ditolak' : 'Menunggu Pembayaran'}
                          </p>
                        </div>
                        <div className="bg-white p-4">
                          {order.rejection_reason && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Alasan Penolakan:</p>
                              <p className="text-sm text-red-700 font-medium italic">"{order.rejection_reason}"</p>
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mb-4">
                            {order.rejection_reason 
                              ? 'Silakan perbaiki pembayaran Anda dan upload ulang bukti pembayaran yang valid.'
                              : 'Pesanan ini menunggu pembayaran. Silakan lakukan transfer dan upload bukti pembayaran.'}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-orange-700">
                              {formatCurrency(order.total_price || order.total_amount)}
                            </p>
                            <button
                              onClick={() => navigate('/order-success', {
                                state: {
                                  orderId: order.id,
                                  orderNumber: order.order_number || order.id,
                                  totalAmount: order.total_price || order.total_amount
                                }
                              })}
                              className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition shadow-sm flex items-center gap-2 ${
                                order.rejection_reason 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                              }`}
                            >
                              <FiUpload size={16} />
                              {order.rejection_reason ? 'Upload Ulang Bukti' : 'Upload Bukti'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ WAITING_CONFIRMATION: Tampilkan bukti yang sudah diupload ═══ */}
                    {isWaitingConfirmation(order.status) && (
                      <div className="rounded-xl overflow-hidden border border-orange-200">
                        <div className="bg-gradient-to-r from-orange-400 to-amber-400 px-4 py-3 flex items-center gap-2">
                          <FiClock className="text-white" size={18} />
                          <p className="text-white font-semibold text-sm">Bukti Pembayaran Diterima</p>
                        </div>
                        <div className="bg-white p-4 space-y-3">
                          <p className="text-sm text-gray-600">Bukti pembayaran Anda sedang diverifikasi oleh admin. Mohon tunggu.</p>
                          {order.payment_proof && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-gray-500 uppercase">Bukti yang diupload</p>
                              {order.payment_proof.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <a href={fixProofUrl(order.payment_proof)} target="_blank" rel="noreferrer">
                                  <img src={fixProofUrl(order.payment_proof)} alt="Bukti Pembayaran" className="w-full max-h-48 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition" />
                                </a>
                              ) : (
                                <a href={fixProofUrl(order.payment_proof)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm">
                                  <FiImage size={16} /> Lihat Bukti Pembayaran
                                </a>
                              )}
                              {order.payment_uploaded_at && (
                                <p className="text-xs text-gray-400">Diupload: {formatDate(order.payment_uploaded_at)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Detail Pesanan</h3>
                      <div className="space-y-2">
                        {order.items && Array.isArray(order.items) ? (
                          order.items.map((item, index) => {
                            const isCompleted = ['delivered', 'completed'].includes((order.status || '').toLowerCase());
                            const reviewKey = `${order.id}_${item.product_id}`;
                            const alreadyReviewed = reviewedItems[reviewKey];
                            return (
                              <div key={index} className="flex justify-between items-center py-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.product_name || item.name}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-medium text-gray-900">{formatCurrency(item.price || item.product_price)}</p>
                                  {isCompleted && (
                                    alreadyReviewed ? (
                                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                        <FiCheck size={10} /> Diulas
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReviewModal({
                                            orderId: order.id,
                                            productId: item.product_id,
                                            productName: item.product_name || item.name
                                          });
                                          setReviewRating(0);
                                          setReviewText('');
                                        }}
                                        className="text-[10px] font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border border-yellow-200"
                                      >
                                        <FiStar size={10} /> Ulas
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-600">Informasi produk tidak tersedia</p>
                        )}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="bg-white rounded-lg p-3 space-y-3">
                      {order.address && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Alamat Pengiriman</p>
                          <p className="text-sm text-gray-900">{order.address}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Catatan</p>
                          <p className="text-sm text-gray-900 italic">"{order.notes}"</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Tanggal Pesan</p>
                          <p className="text-sm text-gray-900">{formatDate(order.created_at || order.order_date)}</p>
                        </div>
                        {order.shipped_date && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Tanggal Pengiriman</p>
                            <p className="text-sm text-gray-900">{formatDate(order.shipped_date)}</p>
                          </div>
                        )}
                      </div>
                      {order.tracking_number && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Nomor Resi</p>
                          <p className="text-sm font-mono text-gray-900">{order.tracking_number}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Metode Pembayaran</p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const method = (order.payment_method || 'transfer').toLowerCase();
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
                            const m = labels[method] || { label: order.payment_method || 'Transfer Bank', icon: '💳', color: 'bg-gray-50 text-gray-700 border-gray-200' };
                            return (
                              <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${m.color}`}>
                                <span>{m.icon}</span>
                                {m.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(order.subtotal || order.total_price)}</span>
                      </div>
                      {order.shipping_cost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ongkos Kirim</span>
                          <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-blue-600">{formatCurrency(order.total_price || order.total_amount)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {(!order.status || ['pending', 'waiting_confirmation', 'rejected', 'processing', 'settlement', ''].includes((order.status || '').toLowerCase())) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="flex-1 px-4 py-2 border border-red-300 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50 transition"
                        >
                          Batalkan Pesanan
                        </button>
                      )}
                      {(order.status || '').toLowerCase() === 'shipped' && (
                        <button
                          onClick={() => handleReceiveOrder(order.id)}
                          className="flex-1 px-4 py-2 bg-green-500 text-white font-medium text-sm rounded-lg hover:bg-green-600 transition"
                        >
                          Pesanan Diterima
                        </button>
                      )}
                      <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition">
                        Hubungi Penjual
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Beri Ulasan</h3>
              <p className="text-xs text-gray-500 mt-1">{reviewModal.productName}</p>
            </div>
            <div className="p-5 space-y-5">
              {/* Star Rating */}
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Rating</p>
                <div className="flex gap-2 justify-center">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-125 active:scale-95"
                    >
                      <svg
                        width="32" height="32" viewBox="0 0 24 24"
                        fill={(reviewHover || reviewRating) >= star ? '#FBBF24' : 'none'}
                        stroke={(reviewHover || reviewRating) >= star ? '#FBBF24' : '#D1D5DB'}
                        strokeWidth="2"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <p className="text-center text-xs font-bold text-yellow-600 mt-2">
                    {['', 'Sangat Buruk', 'Buruk', 'Cukup Baik', 'Baik', 'Sangat Baik'][reviewRating]}
                  </p>
                )}
              </div>
              {/* Review Text */}
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Ulasan (opsional)</p>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Ceritakan pengalaman kamu dengan produk ini..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold text-xs uppercase rounded-xl hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (reviewRating === 0) {
                    showError('Silakan pilih rating terlebih dahulu');
                    return;
                  }
                  setSubmittingReview(true);
                  try {
                    const res = await submitReview(reviewModal.productId, reviewModal.orderId, reviewRating, reviewText);
                    if (res.status === 'success') {
                      showSuccess('Ulasan berhasil dikirim!');
                      setReviewedItems(prev => ({ ...prev, [`${reviewModal.orderId}_${reviewModal.productId}`]: true }));
                      setReviewModal(null);
                    } else {
                      showError(res.message || 'Gagal mengirim ulasan');
                    }
                  } catch (err) {
                    showError('Terjadi kesalahan saat mengirim ulasan');
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                disabled={reviewRating === 0 || submittingReview}
                className="flex-1 py-3 bg-black text-white font-bold text-xs uppercase rounded-xl hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserProfileLayout>
  );
};

export default Orders;
