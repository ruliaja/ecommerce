import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-12 pb-6">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-black tracking-tighter">OUTFITKITA</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>
            Destinasi fashion streetwear nomor satu di Indonesia. Kami menghadirkan kualitas premium dengan gaya yang paling up-to-date.
          </p>
          <div className="flex space-x-4">
            <FiInstagram className="cursor-pointer hover:text-yellow-500" size={20} />
            <FiTwitter className="cursor-pointer hover:text-yellow-500" size={20} />
            <FiFacebook className="cursor-pointer hover:text-yellow-500" size={20} />
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#d1d5db' }}>Kategori</h4>
          <ul className="space-y-3 text-sm" style={{ color: '#d1d5db' }}>
            <li><Link to="/products" className="hover:text-white">Semua Produk</Link></li>
            <li><Link to="/products?category=Pria" className="hover:text-white">Pria</Link></li>
            <li><Link to="/products?category=Wanita" className="hover:text-white">Wanita</Link></li>
            <li><Link to="/products?category=Unisex" className="hover:text-white">Unisex</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#d1d5db' }}>Bantuan & Info</h4>
          <ul className="space-y-3 text-sm" style={{ color: '#d1d5db' }}>
            <li><Link to="/about" className="hover:text-white">Tentang Kami</Link></li>
            <li><Link to="/profile/orders" className="hover:text-white">Status Pesanan</Link></li>
            <li><Link to="/profile/address" className="hover:text-white">Informasi Pengiriman</Link></li>  
            <li><Link to="/faq" className="hover:text-white">Hubungi Kami / FAQ</Link></li>
          </ul>
        </div>

        {/* Newsletter Quick Link */}
        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#d1d5db' }}>Pembayaran</h4>
          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-800 px-3 py-1 rounded text-[10px]">GO-PAY</span>
            <span className="bg-gray-800 px-3 py-1 rounded text-[10px]">BANK TRANSFER</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 mt-12 pt-6 border-t border-gray-900 text-center text-xs" style={{ color: '#9ca3af' }}>
        <p>© {new Date().getFullYear()} OutfitKita. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;