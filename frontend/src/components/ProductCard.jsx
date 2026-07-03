import React, { useState } from 'react';
import { FiShoppingBag, FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showError, showSuccess } = useNotification();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  
  const wishlistStatus = isInWishlist(product?.id);

  // Defensive check for product data
  if (!product || !product.id || !product.name) {
    return null;
  }

  const formatRupiah = (number) => {
    const numValue = parseInt(number) || 0;
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(numValue);
  };

  const handleViewDetail = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showError('Silakan login terlebih dahulu untuk menambahkan produk ke keranjang');
      navigate('/login');
      return;
    }

    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showError('Silakan login terlebih dahulu untuk menambahkan ke favorit');
      navigate('/login');
      return;
    }

    setIsUpdatingWishlist(true);
    try {
      if (wishlistStatus) {
        await removeFromWishlist(product.id);
        showSuccess(`${product.name} dihapus dari favorit`);
      } else {
        await addToWishlist(product);
        showSuccess(`${product.name} ditambahkan ke favorit`);
      }
    } catch (error) {
      showError('Gagal memperbarui favorit');
      console.error(error);
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  return (
    <div 
      onClick={handleViewDetail}
      className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col cursor-pointer h-full border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-3/4 rounded-xl overflow-hidden mb-4 bg-gray-50">
        <img 
          src={product.image_url || product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badge */}
        {product.is_new && (
          <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            ✨ BARU
          </span>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3">
          <button 
            onClick={toggleWishlist}
            disabled={isUpdatingWishlist}
            className={`p-2 rounded-full backdrop-blur-sm transition-all disabled:opacity-50 ${
              wishlistStatus 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 text-black hover:bg-white'
            }`}
          >
            <FiHeart size={18} fill={wishlistStatus ? 'currentColor' : 'none'} />
          </button>
        </div>
        
      </div>
      
      {/* Product Info */}
      <div className="grow px-2">
        <p className="text-[11px] font-black mb-1 uppercase tracking-[0.1em]" style={{ color: '#4b5563' }}>{product.category}</p>
        <h3 className="text-sm font-bold text-black mb-1.5 leading-tight group-hover:text-black transition-colors line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: '#374151' }}>
            {product.description}
          </p>
        )}
      </div>
      
      {/* Price & Action */}
      <div className="flex items-center justify-between px-2 mt-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-base font-black text-black">
            {formatRupiah(product.price)}
          </p>
          {product.original_price && product.original_price > product.price && (
            <p className="text-xs line-through" style={{ color: '#6b7280' }}>
              {formatRupiah(product.original_price)}
            </p>
          )}
        </div>
        <button 
          onClick={handleViewDetail}
          className="text-[10px] font-bold text-black bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-black hover:text-white transition-all uppercase tracking-wider"
        >
          Detail
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
