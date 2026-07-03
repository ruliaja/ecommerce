import React, { useState } from 'react';
import { FiMenu, FiX, FiLogOut, FiHome, FiBox, FiShoppingCart, FiUsers, FiSettings, FiCreditCard, FiBarChart2, FiMessageCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminLayout = ({ children, currentPage = 'dashboard', noPadding = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/admin' },
    { id: 'products', label: 'Produk', icon: FiBox, path: '/admin/products' },
    { id: 'orders', label: 'Pesanan', icon: FiShoppingCart, path: '/admin/orders' },
    { id: 'sales-report', label: 'Laporan', icon: FiBarChart2, path: '/admin/sales-report' },
    { id: 'users', label: 'Pengguna', icon: FiUsers, path: '/admin/users' },
    { id: 'payment-settings', label: 'Pembayaran', icon: FiCreditCard, path: '/admin/payment-settings' },
    { id: 'chat', label: 'Chat', icon: FiMessageCircle, path: '/admin/chat' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['Inter',_sans-serif]">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-60' : 'w-20'
        } bg-[#0f172a] text-white transition-all duration-300 flex flex-col shadow-2xl z-30`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800/50">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tighter uppercase">OutfitKita</h1>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-yellow-400 text-[#0f172a] shadow-lg shadow-yellow-400/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-[#0f172a]' : 'group-hover:scale-110 transition-transform'}`} />
                {sidebarOpen && <span className="font-semibold text-xs tracking-wide">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all group"
          >
            <FiLogOut size={18} className="flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
            {sidebarOpen && <span className="font-bold text-xs tracking-wide uppercase">Keluar</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-yellow-400 rounded-full"></div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right border-r border-slate-200 pr-4 hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Administrator</p>
              <p className="text-xs font-bold text-slate-800 leading-none">OutfitKita Team</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shadow-inner">
              <FiUsers size={16} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 ${noPadding ? 'overflow-hidden' : 'overflow-auto p-5'}`}>
          <div className={`mx-auto ${noPadding ? 'h-full w-full' : 'max-w-[1600px]'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
