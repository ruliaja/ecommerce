import React, { useState, useEffect } from 'react';
import { FiBox, FiShoppingCart, FiUsers, FiTrendingUp, FiArrowUp, FiArrowDown, FiClock, FiCheckCircle, FiTruck, FiCheck, FiXCircle, FiRotateCcw } from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import axiosInstance from '../../api/axiosInstance';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    statusCounts: {
      pending: 0,
      waiting_confirmation: 0,
      processing: 0,
      settlement: 0,
      shipped: 0,
      delivered: 0,
      completed: 0,
      cancel: 0,
      cancelled: 0,
      expire: 0
    }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('?action=get_dashboard_stats');
      
      if (response.data.status === 'success') {
        setStats(response.data.data.stats);
        setRecentOrders(response.data.data.recentOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(number || 0);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} className={color.replace('bg-', 'text-').replace('-100', '-600')} />
        </div>
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
          <p className="text-lg font-black text-slate-800 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Ringkasan Bisnis</h3>
            <p className="text-xs text-slate-500">Pantau performa toko Anda secara real-time</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div className="text-right border-r border-slate-200 pr-4">
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mb-0.5">Hari Ini</p>
              <p className="text-xs font-bold text-slate-700">
                {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(currentTime)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mb-0.5">Waktu Server</p>
              <p className="text-base font-black text-blue-600 tabular-nums">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-100 h-20 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FiBox} label="Produk" value={stats.totalProducts} color="bg-blue-100" />
            <StatCard icon={FiShoppingCart} label="Pesanan" value={stats.totalOrders} color="bg-orange-100" />
            <StatCard icon={FiTrendingUp} label="Pendapatan" value={formatRupiah(stats.totalRevenue)} color="bg-green-100" />
            <StatCard icon={FiUsers} label="Pengguna" value={stats.totalUsers} color="bg-purple-100" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Status Pesanan</h3>
              <div className="space-y-2">
                {[
                  { label: 'Belum Bayar', count: stats.statusCounts.pending + stats.statusCounts.expire, color: 'text-slate-500', bg: 'bg-slate-50', icon: FiClock },
                  { label: 'Konfirmasi', count: stats.statusCounts.waiting_confirmation, color: 'text-orange-600', bg: 'bg-orange-50', icon: FiRotateCcw },
                  { label: 'Diproses', count: stats.statusCounts.processing + stats.statusCounts.settlement, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: FiCheckCircle },
                  { label: 'Dikirim', count: stats.statusCounts.shipped, color: 'text-blue-600', bg: 'bg-blue-50', icon: FiTruck },
                  { label: 'Selesai', count: stats.statusCounts.completed + stats.statusCounts.delivered, color: 'text-green-600', bg: 'bg-green-50', icon: FiCheck },
                  { label: 'Batal', count: stats.statusCounts.cancel + stats.statusCounts.cancelled, color: 'text-red-600', bg: 'bg-red-50', icon: FiXCircle },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${item.bg} border border-white transition-all hover:scale-[1.02] cursor-default`}>
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className={item.color} />
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className={`text-sm font-black ${item.color}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders Table-like list */}
          <div className="lg:col-span-2">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pesanan Terbaru</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <table className="w-full text-left relative">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pesanan</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentOrders.length > 0 ? (
                        recentOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 py-3 text-xs font-black text-slate-800">{order.id}</td>
                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                              {order.date ? new Date(order.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{order.customer}</td>
                            <td className="px-4 py-3 text-xs font-black text-slate-800 text-right">{formatRupiah(order.amount)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                order.status === 'Delivered' || order.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                                order.status === 'Shipped' || order.status === 'Dikirim' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Processing' || order.status === 'Diproses' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-xs text-slate-400 italic">Belum ada pesanan masuk</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
