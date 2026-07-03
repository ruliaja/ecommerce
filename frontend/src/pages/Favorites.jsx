import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiHeart, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import ProductCard from '../components/ProductCard';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const formatRupiah = (number) => {
    const numValue = parseInt(number) || 0;
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(numValue);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    showSuccess(`${product.name} ditambahkan ke keranjang`);
  };

  const handleRemove = async (productId) => {
    setIsDeleting(true);
    try {
      await removeFromWishlist(productId);
      const product = wishlist.find(p => p.id === productId);
      showSuccess(`${product?.name || 'Produk'} dihapus dari favorit`);
    } catch (error) {
      showError('Gagal menghapus dari favorit');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    const { isConfirmed } = await showConfirm('Hapus Semua Favorit', 'Apakah Anda yakin ingin menghapus semua favorit?', 'Ya, Hapus Semua', 'Batal');
    if (isConfirmed) {
      setIsDeleting(true);
      try {
        await clearWishlist();
        showSuccess('Semua favorit telah dihapus');
      } catch (error) {
        showError('Gagal menghapus favorit');
        console.error(error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const totalPrice = wishlist.reduce((sum, product) => sum + parseInt(product.price || 0), 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="text-white py-10 md:py-12 shadow-inner relative overflow-hidden" style={{ backgroundColor: '#111827' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(0,0,0,0.2), transparent)' }}></div>
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-4 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            style={{ color: '#9ca3af' }}
          >
            <FiArrowLeft size={16} />
            <span>Kembali</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
            <FiHeart size={32} fill="currentColor" className="text-red-500" />
            Favorit Saya
          </h1>
          <p className="text-base" style={{ color: '#e5e7eb' }}>
            {wishlist.length} produk favorit  
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="text-6xl mb-6">💔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Belum ada favorit</h2>
            <p className="text-gray-600 mb-8">
              Tambahkan produk favorit Anda dengan klik icon hati untuk menyimpannya di sini
            </p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-900 transition-all"
            >
              Jelajahi Produk
            </button>
          </div>
        ) : (
          <>
            {/* Summary Section */}
            <div className="bg-gray-50 rounded-2xl p-4 md:p-6 mb-8 border border-gray-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Total Produk</p>
                    <p className="text-2xl font-black text-black">{wishlist.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Total Harga</p>
                    <p className="text-2xl font-black text-black">{formatRupiah(totalPrice)}</p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleClearAll}
                    disabled={isDeleting}
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 border border-red-100"
                  >
                    <FiTrash2 size={16} />
                    Hapus Semua
                  </button>
                </div>
              </div>
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {wishlist.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard 
                    product={product} 
                    onAddToCart={handleAddToCart}
                  />
                  {/* Delete button overlay */}
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity z-10 hover:bg-red-600 disabled:opacity-50"
                    title="Hapus dari favorit"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center flex-wrap pb-12">
              <button
                onClick={() => navigate('/products')}
                className="bg-gray-100 text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all"
              >
                Lanjut Belanja
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
              >
                Beli Sekarang ({wishlist.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
