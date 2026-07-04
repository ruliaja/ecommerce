import React, { useState } from 'react';
import { FiUser, FiCreditCard, FiMapPin, FiLock, FiBell, FiShield, FiShoppingBag, FiBell as FiBellNotif, FiGift, FiDollarSign, FiLogOut, FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserProfileLayout = ({ children, currentPage = 'profile' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const accountMenu = [
    { id: 'profile', label: 'Profil', icon: FiUser, path: '/profile' },
    { id: 'address', label: 'Alamat', icon: FiMapPin, path: '/profile/address' },
    { id: 'password', label: 'Ubah Password', icon: FiLock, path: '/profile/password' },
  ];

  const otherMenu = [
    { id: 'orders', label: 'Pesanan Saya', icon: FiShoppingBag, path: '/profile/orders' },
    { id: 'favorites', label: 'Favorit', icon: FiHeart, path: '/favorites' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const MenuItem = ({ item, isActive }) => {
    const Icon = item.icon;
    return (
      <button
        onClick={() => navigate(item.path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-sm ${
          isActive
            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white/90 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:shadow-lg z-10 shrink-0 flex flex-col">
        {/* Header - Desktop Only */}
        <h2 className="hidden md:block text-lg font-bold text-gray-900 mb-6">Akun Saya, <span className="text-black">{user?.username || user?.name}</span></h2>
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Menu Akun</h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{user?.username || user?.name}</span>
        </div>

        {/* Menus */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          
          {/* Account Menu (Desktop) */}
          <div className="hidden md:block mb-8 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Akun</h3>
            {accountMenu.map(item => (
              <MenuItem key={item.id} item={item} isActive={currentPage === item.id} />
            ))}
          </div>

          {/* Divider (Desktop) */}
          <div className="hidden md:block border-b border-gray-200 mb-8"></div>

          {/* Other Menu (Desktop) */}
          <div className="hidden md:block mb-8 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Lainnya</h3>
            {otherMenu.map(item => (
              <MenuItem key={item.id} item={item} isActive={currentPage === item.id} />
            ))}
          </div>
          
          {/* Mobile All Menus Horizontal Scroll */}
          <div className="md:hidden flex gap-2 w-max">
             {[...accountMenu, ...otherMenu].map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border shadow-sm ${
                    currentPage === item.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
             ))}
             <button
               onClick={handleLogout}
               className="flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border border-red-200 bg-red-50 text-red-600 shadow-sm"
             >
               <FiLogOut size={14} />
               Logout
             </button>
          </div>
        </div>

        {/* Logout Button - Desktop */}
        <div className="hidden md:block border-t border-gray-200 pt-6 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm font-bold shadow-sm border border-transparent hover:border-red-100"
          >
            <FiLogOut size={18} className="flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 flex items-start justify-center w-full min-w-0">
        <div className="w-full max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default UserProfileLayout;
