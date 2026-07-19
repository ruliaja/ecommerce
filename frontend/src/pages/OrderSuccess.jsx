import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCheck, FiUpload, FiImage, FiX,
  FiCopy, FiCheckCircle, FiAlertCircle, FiClock,
  FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { uploadPaymentProof, getOrderStatus, updateOrderStatus } from '../api/orderService';

const POLL_INTERVAL = 15000; // poll every 15 seconds

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { orderId, orderNumber, totalAmount, selectedPayment } = location.state || {};

  // ── File upload state ──────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // ── Order status state ─────────────────────────────────────────────────────
  const [orderStatus, setOrderStatus] = useState(null); // null = loading
  const [rejectionReason, setRejectionReason] = useState(null);
  const pollRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  // ── Fetch current order status ─────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    const result = await getOrderStatus(orderId);
    if (result) {
      setOrderStatus(result.status);
      setRejectionReason(result.rejection_reason || null);
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  // ── File processing ────────────────────────────────────────────────────────
  const processFile = (file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showError('Ukuran file maksimal 15MB');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showError('Format file tidak didukung. Gunakan JPG, PNG, GIF, WebP, atau PDF');
      return;
    }
    setSelectedFile(file);
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const handleFileSelect = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCopyAccount = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    });
  };

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleUploadProof = async () => {
    if (!selectedFile) { showError('Pilih file bukti pembayaran terlebih dahulu'); return; }
    if (!orderId) { showError('Order ID tidak ditemukan'); return; }
    setUploading(true);
    try {
      const res = await uploadPaymentProof(orderId, selectedFile);
      if (res.status === 'success') {
        showSuccess('Bukti pembayaran berhasil diupload! Menunggu konfirmasi admin.');
        handleRemoveFile();
        // immediately refresh status
        await fetchStatus();
      } else {
        showError(res.message || 'Gagal mengupload bukti pembayaran');
      }
    } catch {
      showError('Terjadi kesalahan saat mengupload bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  // ── Cancel handler ─────────────────────────────────────────────────────────
  const handleCancelOrder = async () => {
    if (!orderId) return;
    const { isConfirmed } = await showConfirm('Batalkan Pesanan', 'Apakah Anda yakin ingin membatalkan pesanan ini?', 'Ya, Batalkan', 'Kembali');
    if (isConfirmed) {
      try {
        const res = await updateOrderStatus(orderId, 'cancelled');
        if (res.status === 'success') {
          showSuccess('Pesanan berhasil dibatalkan');
          navigate('/profile/orders');
        } else {
          showError(res.message || 'Gagal membatalkan pesanan');
        }
      } catch (error) {
        showError('Terjadi kesalahan saat membatalkan pesanan');
      }
    }
  };

  // ── Derived flags ──────────────────────────────────────────────────────────
  const isRejected = orderStatus === 'rejected' || orderStatus === 'payment_rejected';
  const isWaiting  = orderStatus === 'waiting_confirmation';
  const isApproved = ['processing', 'shipped', 'delivered', 'completed', 'settlement'].includes(orderStatus);
  // Show upload form: either we haven't uploaded yet (pending/null) OR proof was rejected
  const showUploadForm = !isWaiting && !isApproved;

  // ── Upload Area sub-component ──────────────────────────────────────────────
  const UploadArea = () => (
    <div className="bg-white px-5 py-5 space-y-3">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload Bukti Transfer</p>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          <img src={preview} alt="Preview" className="w-full max-h-48 object-contain" />
          <button onClick={handleRemoveFile} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black transition">
            <FiX size={14} />
          </button>
        </div>
      ) : selectedFile ? (
        <div className="relative flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50">
          <FiImage size={20} className="text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-black truncate">{selectedFile.name}</p>
            <p className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={handleRemoveFile} className="text-red-500 p-1 hover:bg-red-50 rounded-lg transition">
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor="proof-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FiUpload size={20} className={dragOver ? 'text-blue-500' : 'text-gray-400'} />
          <p className="text-xs font-bold text-gray-600">Klik atau seret bukti transfer</p>
          <p className="text-[10px] text-gray-400">JPG, PNG, WebP, PDF · maks 5 MB</p>
          <input id="proof-upload" type="file" accept="image/*,.pdf" className="hidden" ref={fileRef} onChange={handleFileSelect} />
        </label>
      )}

      <button
        onClick={handleUploadProof}
        disabled={!selectedFile || uploading}
        className="w-full h-12 bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-gray-800 transition disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg"
      >
        {uploading ? 'Mengirim...' : 'Konfirmasi Pembayaran'}
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-20 pb-12">
      <div className="max-w-lg w-full">

        {/* ═══ Success Header ═══ */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100 mb-4">
            <FiCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-black mb-1 tracking-tight">Pesanan Berhasil!</h1>
          <p className="text-sm" style={{ color: '#4b5563' }}>Terima kasih telah berbelanja di OutFitKita.</p>
        </div>

        {/* ═══ Order Number Card ═══ */}
        {orderNumber && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#6b7280' }}>Nomor Pesanan</p>
              <p className="text-lg font-black text-black font-mono">#{orderNumber}</p>
            </div>
            <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Dibuat
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CASE 1 — Bukti DITOLAK                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isRejected && (
          <div className="rounded-2xl overflow-hidden border border-red-200 shadow-sm mb-6">
            {/* Header merah */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-5 py-4 flex items-center gap-3">
              <FiAlertTriangle className="text-white shrink-0" size={22} />
              <div>
                <p className="text-white font-bold text-base">Bukti Pembayaran Ditolak</p>
                <p className="text-red-100 text-xs">Harap upload ulang bukti yang valid</p>
              </div>
            </div>

            {/* Alasan penolakan */}
            {rejectionReason && (
              <div className="bg-red-50 px-5 py-4 border-b border-red-100">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1.5">Alasan Penolakan</p>
                <p className="text-sm text-red-800 font-semibold leading-relaxed">{rejectionReason}</p>
              </div>
            )}

            {/* Catatan instruksi */}
            <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-start gap-2">
              <FiAlertCircle className="text-amber-600 mt-0.5 shrink-0" size={15} />
              <p className="text-xs text-amber-800">
                Pastikan bukti transfer mencantumkan <strong>nominal yang sesuai</strong>, <strong>tanggal transfer</strong>, dan <strong>rekening tujuan yang benar</strong> sebelum mengupload ulang.
              </p>
            </div>

            {/* Rekening tujuan (tampilkan kembali agar user tidak salah transfer) */}
            {selectedPayment && (
              <div className="bg-white px-5 py-4 space-y-2 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rekening Tujuan</p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: '#6b7280' }}>{selectedPayment.bank_name}</p>
                    <p className="text-base font-black text-black tracking-wider font-mono">{selectedPayment.account_number}</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPayment.account_holder}</p>
                  </div>
                  <button
                    onClick={() => handleCopyAccount(selectedPayment.account_number)}
                    className="ml-4 px-3 py-1.5 bg-white text-blue-600 border border-blue-100 rounded-lg shadow-sm hover:bg-blue-50 transition flex items-center gap-1.5 text-xs font-black uppercase tracking-widest shrink-0"
                  >
                    {copiedAccount ? 'Copied!' : <><FiCopy size={12} /> Copy</>}
                  </button>
                </div>
              </div>
            )}

            {/* Total tagihan */}
            {totalAmount && (
              <div className="bg-white px-5 py-3 border-b border-gray-100">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Tagihan Pembayaran</p>
                <p className="text-2xl font-black text-black">{formatCurrency(totalAmount)}</p>
              </div>
            )}

            {/* Upload form ulang */}
            <UploadArea />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CASE 2 — Menunggu verifikasi (sudah upload, belum ada keputusan)   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isWaiting && (
          <div className="rounded-2xl overflow-hidden border border-green-200 shadow-sm mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4 flex items-center gap-3">
              <FiCheckCircle className="text-white" size={20} />
              <div>
                <p className="text-white font-bold text-base">Bukti Pembayaran Terkirim</p>
                <p className="text-green-100 text-xs">Menunggu verifikasi admin</p>
              </div>
            </div>
            <div className="bg-white p-5 space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
                <FiClock size={20} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-800">
                  Bukti pembayaran Anda sedang diverifikasi. Harap Menunggu konfirmasi.
                </p>
              </div>
              <button
                onClick={fetchStatus}
                className="w-full h-10 border border-gray-200 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <FiRefreshCw size={12} /> Perbarui Status
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CASE 3 — Pembayaran dikonfirmasi / diproses                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isApproved && (
          <div className="rounded-2xl overflow-hidden border border-blue-200 shadow-sm mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 flex items-center gap-3">
              <FiCheckCircle className="text-white" size={20} />
              <div>
                <p className="text-white font-bold text-base">Pembayaran Dikonfirmasi</p>
                <p className="text-blue-100 text-xs">Pesanan Anda sedang diproses</p>
              </div>
            </div>
            <div className="bg-white p-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <FiCheckCircle size={20} className="text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800">
                  Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses dan akan segera dikirim.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CASE 4 — Belum upload (pending / status awal)                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {showUploadForm && !isRejected && (
          <div className="rounded-2xl overflow-hidden border border-orange-200 shadow-sm mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 flex items-center gap-3">
              <FiAlertCircle className="text-white" size={20} />
              <div>
                <p className="text-white font-bold text-base">Selesaikan Pembayaran</p>
                <p className="text-orange-100 text-xs">Lakukan transfer dan upload bukti pembayaran</p>
              </div>
            </div>

            {/* Total Amount */}
            {totalAmount && (
              <div className="bg-orange-50 px-5 py-3 border-b border-orange-100">
                <p className="text-[10px] text-orange-700 font-black uppercase tracking-widest mb-0.5">Tagihan Pembayaran</p>
                <p className="text-2xl font-black text-orange-700">{formatCurrency(totalAmount)}</p>
              </div>
            )}

            {/* Rekening */}
            {selectedPayment && (
              <div className="bg-white px-5 py-4 space-y-2 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rekening Tujuan</p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: '#6b7280' }}>{selectedPayment.bank_name}</p>
                    <p className="text-base font-black text-black tracking-wider font-mono">{selectedPayment.account_number}</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPayment.account_holder}</p>
                  </div>
                  <button
                    onClick={() => handleCopyAccount(selectedPayment.account_number)}
                    className="ml-4 px-3 py-1.5 bg-white text-blue-600 border border-blue-100 rounded-lg shadow-sm hover:bg-blue-50 transition flex items-center gap-1.5 text-xs font-black uppercase tracking-widest shrink-0"
                  >
                    {copiedAccount ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <UploadArea />
          </div>
        )}

        {/* ═══ Next Steps ═══ */}
        <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-xs font-black text-black mb-4 uppercase tracking-[0.2em]">Langkah Selanjutnya</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black flex items-center justify-center shrink-0">1</span>
              <p className="text-xs" style={{ color: '#4b5563' }}>Transfer sesuai nominal dan upload bukti pembayaran.</p>
            </div>
            <div className="flex gap-4">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black flex items-center justify-center shrink-0">2</span>
              <p className="text-xs" style={{ color: '#4b5563' }}>Tunggu validasi admin (maksimal 24 jam).</p>
            </div>
            <div className="flex gap-4">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black flex items-center justify-center shrink-0">3</span>
              <p className="text-xs" style={{ color: '#4b5563' }}>Jika bukti ditolak, upload ulang bukti yang valid sesuai instruksi.</p>
            </div>
          </div>
        </div>

        {/* ═══ Actions ═══ */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => navigate('/profile/orders')}
            className="h-12 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-lg"
          >
            Pesanan Saya
          </button>
          <button
            onClick={() => navigate('/products')}
            className="h-12 bg-white text-black border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 transition"
          >
            Belanja Lagi
          </button>
        </div>
        
        {/* Cancel Button */}
        {(!isApproved || ['processing', 'settlement'].includes(orderStatus)) && orderStatus !== 'cancelled' && (
          <button
            onClick={handleCancelOrder}
            className="w-full h-12 bg-white text-red-600 border border-red-200 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 transition"
          >
            Batalkan Pesanan
          </button>
        )}

        <p className="text-xs text-gray-500 mt-8 text-center">
          Perlu bantuan? Hubungi kami di support@outfitkita.com atau WhatsApp +62 812-xxxx-xxxx
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
