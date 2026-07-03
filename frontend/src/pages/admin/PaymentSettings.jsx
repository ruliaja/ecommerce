import React, { useState, useEffect } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiCreditCard, FiSave, FiX, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getPaymentSettings,
  addPaymentSetting,
  updatePaymentSetting,
  deletePaymentSetting,
  togglePaymentSetting
} from '../../api/paymentSettingsService';
import { useNotification } from '../../context/NotificationContext';

const BANK_LOGOS = {
  'BCA': '🏦', 'Mandiri': '🏦', 'BNI': '🏦', 'BRI': '🏦', 'CIMB': '🏦', 'Permata': '🏦', 'BTN': '🏦', 'Danamon': '🏦', 'GoPay': '💚', 'OVO': '💜', 'Dana': '💙', 'ShopeePay': '🧡',
};

const POPULAR_BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata Bank', 'BTN', 'Danamon', 'GoPay', 'OVO', 'Dana', 'ShopeePay'];
const emptyForm = { bank_name: '', account_number: '', account_holder: '', description: '', is_active: true };

const PaymentSettings = () => {
  const { showConfirm } = useNotification();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => { loadSettings(); }, []);
  const showNotif = (msg, type = 'success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getPaymentSettings(false);
      if (res.status === 'success') setSettings(res.data || []);
    } catch (e) { showNotif('Gagal memuat data', 'error'); } finally { setLoading(false); }
  };

  const openAddForm = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEditForm = (setting) => { setEditId(setting.id); setForm({ bank_name: setting.bank_name, account_number: setting.account_number, account_holder: setting.account_holder, description: setting.description || '', is_active: setting.is_active, }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.bank_name || !form.account_number || !form.account_holder) { showNotif('Wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      let res = editId ? await updatePaymentSetting(editId, form) : await addPaymentSetting(form);
      if (res.status === 'success') {
        showNotif(editId ? 'Diperbarui' : 'Ditambahkan'); setShowForm(false); loadSettings();
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, bankName) => {
    const { isConfirmed } = await showConfirm('Hapus Rekening', `Hapus ${bankName}?`, 'Ya, Hapus', 'Batal');
    if (!isConfirmed) return;
    setDeletingId(id);
    try {
      const res = await deletePaymentSetting(id);
      if (res.status === 'success') { showNotif('Dihapus'); loadSettings(); }
    } finally { setDeletingId(null); }
  };

  const handleToggle = async (setting) => {
    setTogglingId(setting.id);
    try {
      const res = await togglePaymentSetting(setting.id, !setting.is_active);
      if (res.status === 'success') { showNotif(res.message); loadSettings(); }
    } finally { setTogglingId(null); }
  };

  const getBankEmoji = (bankName) => {
    const key = Object.keys(BANK_LOGOS).find(k => bankName?.toLowerCase().includes(k.toLowerCase()));
    return key ? BANK_LOGOS[key] : '🏦';
  };

  return (
    <AdminLayout currentPage="payment-settings">
      <div className="space-y-4">
        {/* Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-2 rounded-xl shadow-2xl text-white text-xs font-black uppercase tracking-widest transition-all animate-in fade-in slide-in-from-right-4
            ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            <FiCheckCircle size={16} /> {notification.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-lg shadow-blue-100/20">
              <FiCreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Pembayaran</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Metode Transfer & E-Wallet</p>
            </div>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
          >
            <FiPlus size={16} /> Tambah Akun
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: settings.length, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Aktif', value: settings.filter(s => s.is_active).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Off', value: settings.filter(s => !s.is_active).length, color: 'text-slate-400', bg: 'bg-slate-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-slate-200 p-3 bg-white flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center font-black text-sm`}>{s.value}</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List Section */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">MEMUAT DATA...</div>
        ) : settings.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Belum ada rekening</h3>
            <button onClick={openAddForm} className="text-[10px] font-black text-blue-600 uppercase underline">Tambah Rekening Pertama</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.map(setting => (
              <div
                key={setting.id}
                className={`group bg-white rounded-2xl border border-slate-200 p-4 transition-all hover:shadow-lg hover:shadow-slate-200/50 ${!setting.is_active && 'opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${setting.is_active ? 'bg-slate-900' : 'bg-slate-100'}`}>
                    {getBankEmoji(setting.bank_name)}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditForm(setting)} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FiEdit2 size={14} /></button>
                    <button onClick={() => handleDelete(setting.id, setting.bank_name)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FiTrash2 size={14} /></button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{setting.bank_name}</p>
                    <button onClick={() => handleToggle(setting)} className={`transition-all ${setting.is_active ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {setting.is_active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                    </button>
                  </div>
                  <p className="text-base font-black text-slate-900 tracking-widest tabular-nums">{setting.account_number}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{setting.account_holder}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/20">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Setup Rekening</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400"><FiX size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank / Provider</label>
                  <input list="banks" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-yellow-400/50 outline-none" required />
                  <datalist id="banks">{POPULAR_BANKS.map(b => <option key={b} value={b} />)}</datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nomor Rekening</label>
                  <input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tabular-nums focus:ring-2 focus:ring-yellow-400/50 outline-none" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Pemilik</label>
                  <input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-yellow-400/50 outline-none" required />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Aktifkan Sekarang</span>
                  <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`transition-all ${form.is_active ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {form.is_active ? <FiToggleRight size={32} /> : <FiToggleLeft size={32} />}
                  </button>
                </div>
                <button type="submit" disabled={saving} className="w-full py-3 bg-slate-900 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition shadow-xl shadow-slate-900/10">
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="bg-slate-900 p-4 rounded-2xl flex items-start gap-3 border border-slate-800">
          <FiInfo className="text-yellow-400 mt-1" />
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
            Akun yang berstatus <span className="text-emerald-400 italic">Aktif</span> akan muncul di halaman checkout user. Gunakan <span className="text-white">ID unik</span> untuk memudahkan verifikasi manual.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentSettings;
