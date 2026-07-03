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
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-6 overflow-y-auto sticky top-0 h-screen shadow-lg">
        {/* Header */}
        <h2 className="text-lg font-bold text-gray-900 mb-6">Akun Saya, <span className="text-black">{user?.username || user?.name}</span></h2>

        {/* Account Menu */}
        <div className="mb-8 space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Akun</h3>
          {accountMenu.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200 mb-8"></div>

        {/* Other Menu */}
        <div className="mb-8 space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Lainnya</h3>
          {otherMenu.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
            />
          ))}
        </div>

        {/* Logout Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm"
          >
            <FiLogOut size={18} className="flex-shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex items-start justify-center">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default UserProfileLayout;
