import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingCart, FiPackage, FiCalendar, FiDollarSign, FiBarChart2, FiDownload, FiSearch, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import axiosInstance from '../../api/axiosInstance';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'http://localhost/OutFitKita3/backend/api/index.php';

const SalesReport = () => {
  const [period, setPeriod] = useState('daily');
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, total_items: 0, total_cancelled_orders: 0, total_cancelled_revenue: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [reportDetails, setReportDetails] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('area');

  useEffect(() => {
    setDateRange({ start: '', end: '' });
    fetchReport({ start: '', end: '' }, period);
  }, [period]);

  const getMinEndDate = () => {
    if (period === 'weekly' && dateRange.start) {
      const parts = dateRange.start.split('-');
      const start = new Date(parts[0], parts[1] - 1, parts[2]);
      start.setDate(start.getDate() + 6);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return dateRange.start || '';
  };

  const handleStartDateChange = (val) => {
    if (period === 'weekly' && val) {
      const parts = val.split('-');
      const start = new Date(parts[0], parts[1] - 1, parts[2]);
      start.setDate(start.getDate() + 6);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      setDateRange({ start: val, end: `${y}-${m}-${d}` });
    } else {
      setDateRange({ ...dateRange, start: val });
    }
  };

  const fetchReport = async (range = dateRange, currentPeriod = period) => {
    try {
      setLoading(true);
      let url = `${API_URL}?action=get_sales_report&period=${currentPeriod}`;
      if (range.start && range.end) {
        url += `&start_date=${range.start}&end_date=${range.end}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data.status === 'success') {
        setReportData(res.data.data || []);
        setSummary(res.data.summary || { total_revenue: 0, total_orders: 0, total_items: 0, total_cancelled_orders: 0, total_cancelled_revenue: 0 });
        setTopProducts(res.data.top_products || []);
        setReportDetails(res.data.details || []);
      }
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseInt(number) || 0);
  const formatShortRupiah = (num) => {
    const n = parseInt(num) || 0;
    if (n >= 1000000) return `Rp${(n / 1000000).toFixed(1)}jt`;
    if (n >= 1000) return `Rp${(n / 1000).toFixed(0)}rb`;
    return `Rp${n}`;
  };

  const formatLabel = (label) => {
    if (!label) return '';
    const strLabel = String(label);
    if (period === 'daily') return new Date(strLabel).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (period === 'weekly') {
      const d = new Date(strLabel);
      const endD = new Date(d);
      endD.setDate(endD.getDate() + 6);
      return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endD.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
    }
    if (period === 'monthly') {
      const parts = strLabel.split('-');
      if (parts.length >= 2) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
      }
    }
    return strLabel;
  };

  const chartData = reportData.map(d => ({ ...d, displayLabel: formatLabel(d.label) }));

  const periods = [
    { key: 'daily', label: 'Harian' },
    { key: 'weekly', label: 'Mingguan' },
    { key: 'monthly', label: 'Bulanan' },
  ];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Header Background
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 210, 35, 'F');

    // Header Text
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("LAPORAN PENJUALAN", 14, 18);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`OUTFITKITA - Periode: ${periods.find(p => p.key === period)?.label || 'Semua'}`, 14, 26);

    let tableColumn, tableRows, footRows;

    if (period === 'daily') {
      tableColumn = ["No", "Tanggal", "ID Pesanan", "Produk", "Pelanggan", "Qty", "Total"];
      tableRows = reportDetails.map((item, i) => [i + 1, item.date, item.order_number, item.product_name, item.customer_name, item.qty, formatRupiah(item.price)]);
      footRows = [
        [{ content: 'TOTAL KESELURUHAN', colSpan: 5, styles: { halign: 'left', fontStyle: 'bold' } }, summary.total_items, formatRupiah(summary.total_revenue)]
      ];
    } else {
      tableColumn = ["No", period === 'monthly' ? "Bulan" : "Minggu", "Orders", "Items", "Revenue"];
      tableRows = reportData.map((row, i) => [i + 1, formatLabel(row.label), row.orders, row.items, formatRupiah(row.revenue)]);
      footRows = [
        [{ content: 'TOTAL KESELURUHAN', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } }, summary.total_orders, summary.total_items, formatRupiah(summary.total_revenue)]
      ];
    }

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      foot: footRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 'wrap' },
        [tableColumn.length - 1]: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }, // Emerald-500 for revenue
        [tableColumn.length - 2]: { halign: 'center' }
      }
    });

    // Add footer to pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Halaman ${i} dari ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Laporan-Penjualan-${period}.pdf`);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] text-white p-3 rounded-xl shadow-2xl border border-white/10 text-[10px]">
          <p className="font-black uppercase tracking-widest mb-2 opacity-50 border-b border-white/10 pb-1">{label}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 mt-1">
              <span className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>{entry.name}:</span>
              <span className="font-black text-yellow-400">{entry.dataKey === 'revenue' ? formatRupiah(entry.value) : entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout currentPage="sales-report">
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-lg shadow-emerald-100/20">
              <FiBarChart2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Laporan</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Analisis Penjualan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              {periods.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${period === p.key ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={handleDownloadPDF} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
              <FiDownload size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
            <FiCalendar size={14} className="text-slate-400" />
            <input
              type={period === 'monthly' ? 'month' : 'date'}
              value={dateRange.start}
              onChange={e => handleStartDateChange(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full"
              placeholder="Dari..."
            />
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
            <FiCalendar size={14} className="text-slate-400" />
            <input
              type={period === 'monthly' ? 'month' : 'date'}
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              min={getMinEndDate()}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full disabled:opacity-50"
              placeholder="Sampai..."
            />
          </div>
          <button onClick={() => fetchReport()} className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all">Terapkan</button>
          <button onClick={() => { setDateRange({ start: '', end: '' }); fetchReport({ start: '', end: '' }); }} className="p-2 text-slate-400 hover:text-slate-600 transition-all"><FiRefreshCw size={16} /></button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pendapatan', value: formatRupiah(summary.total_revenue), icon: FiDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pesanan Masuk', value: summary.total_orders, icon: FiShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Produk Terjual', value: summary.total_items, icon: FiPackage, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Dibatalkan', value: summary.total_cancelled_orders || 0, icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-50', subValue: summary.total_cancelled_revenue ? formatShortRupiah(summary.total_cancelled_revenue) : '' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-black text-slate-800 tracking-tight truncate">{s.value}</p>
                  {s.subValue && <span className="text-[10px] font-bold text-red-400 truncate">({s.subValue})</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">MEMUAT DATA LAPORAN...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Visualisasi Pendapatan</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setChartType('area')} className={`p-1.5 rounded-lg transition-all ${chartType === 'area' ? 'bg-slate-100 text-slate-900' : 'text-slate-300'}`}><FiTrendingUp size={14} /></button>
                    <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-slate-100 text-slate-900' : 'text-slate-300'}`}><FiBarChart2 size={14} /></button>
                  </div>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer minWidth={0}>
                    {chartType === 'area' ? (
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="cRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="displayLabel" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis tickFormatter={formatShortRupiah} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#cRev)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="displayLabel" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis tickFormatter={formatShortRupiah} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Items Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Penjualan Unit & Orders</h3>
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer minWidth={0}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayLabel" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="items" name="Items" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sidebar Data: Top Products */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Produk Terlaris</h3>
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 shrink-0">{i + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-800 truncate">{p.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{p.total_sold} Unit Terjual</p>
                      </div>
                      <p className="text-[10px] font-black text-emerald-600 tabular-nums">{formatShortRupiah(p.total_revenue)}</p>
                    </div>
                  ))}
                  {topProducts.length === 0 && <p className="py-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Belum Ada Data</p>}
                </div>
              </div>

              {/* Detail Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ringkasan Data</h3>
                <div className="max-h-64 overflow-auto scrollbar-hide border border-slate-50 rounded-xl">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-black text-slate-500 uppercase tracking-widest">Periode</th>
                        <th className="px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-right">Items</th>
                        <th className="px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-bold text-slate-700">{formatLabel(row.label)}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{row.items}</td>
                          <td className="px-3 py-2 text-right font-black text-emerald-600">{formatShortRupiah(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SalesReport;
