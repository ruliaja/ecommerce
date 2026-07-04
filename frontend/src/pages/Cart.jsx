import React, { useState } from 'react';
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, removeFromCart, removeMultipleFromCart, updateQuantity, getTotalPrice } = useCart();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleRemove = (cartId) => {
    removeFromCart(cartId);
    showSuccess('Produk dihapus dari keranjang');
  };

  const handleQuantityChange = (cartId, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(cartId, newQuantity);
    }
  };

  const handleSelectItem = (cartId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(cartId)) {
      newSelected.delete(cartId);
    } else {
      newSelected.add(cartId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cart.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set(cart.map(item => item.cart_id));
      setSelectedItems(allIds);
    }
  };

  const getSelectedTotal = () => {
    return cart.reduce((total, item) => {
      if (selectedItems.has(item.cart_id)) {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      showError('Pilih minimal satu produk');
      return;
    }
    navigate('/checkout', { state: { selectedItemIds: Array.from(selectedItems) } });
  };

  const handleDeleteAll = () => {
    if (selectedItems.size === 0) {
      showError('Pilih minimal satu produk untuk dihapus');
      return;
    }

    // Show confirmation dialog using SweetAlert2
    const itemCount = selectedItems.size;
    showConfirm(
      'Konfirmasi Penghapusan',
      `Apakah Anda yakin ingin menghapus ${itemCount} produk dari keranjang?`,
      'Hapus',
      'Batal'
    ).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await removeMultipleFromCart(Array.from(selectedItems));
          setSelectedItems(new Set());
          showSuccess(`${itemCount} produk berhasil dihapus dari keranjang`);
        } catch (error) {
          showError('Gagal menghapus beberapa produk');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-24 px-3 sm:px-6 lg:px-8 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition text-sm"
          >
            <FiArrowLeft size={18} />
            <span>Kembali</span>
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Silakan Login Terlebih Dahulu</h2>
            <p className="text-gray-600 mb-6 text-sm">Anda harus login untuk melihat dan mengelola keranjang belanja</p>
            <button onClick={() => navigate('/login')} className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition font-semibold">
              Login Sekarang
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Keranjang Anda Kosong</h2>
            <p className="text-gray-600 mb-6 text-sm">Mulai berbelanja dan tambahkan produk ke keranjang Anda</p>
            <button onClick={handleContinueShopping} className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition font-semibold">
              Lanjutkan Berbelanja
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl overflow-hidden">
                {/* Select All Bar */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === cart.length && cart.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded cursor-pointer accent-black"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.size === cart.length && cart.length > 0
                        ? `Batal Pilih (${selectedItems.size})`
                        : `Pilih Semua (${selectedItems.size}/${cart.length})`}
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleDeleteAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-xs"
                    >
                      <FiTrash2 size={13} />
                      Hapus ({selectedItems.size})
                    </button>
                  )}
                </div>

                {/* Cart Item List */}
                {cart.map((item, index) => (
                  <div
                    key={item.cart_id || item.id}
                    className={`px-4 py-3 sm:p-6 ${index > 0 ? 'border-t border-gray-100' : ''} ${
                      selectedItems.has(item.cart_id) ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Checkbox */}
                      <div className="shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.cart_id)}
                          onChange={() => handleSelectItem(item.cart_id)}
                          className="w-4 h-4 rounded cursor-pointer accent-black"
                        />
                      </div>

                      {/* Image */}
                      <div className="w-16 h-20 sm:w-24 sm:h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image_url || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</h3>
                          <button onClick={() => handleRemove(item.cart_id)} className="text-red-400 hover:text-red-600 p-0.5 transition shrink-0">
                            <FiTrash2 size={15} />
                          </button>
                        </div>

                        {(item.selected_size || item.selected_color) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selected_size && <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">{item.selected_size}</span>}
                            {item.selected_color && <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">{item.selected_color}</span>}
                          </div>
                        )}

                        <p className="text-sm font-bold text-gray-900 mt-1.5">{formatRupiah(item.price)}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                            <button onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1)} className="p-0.5 hover:bg-gray-200 rounded">
                              <FiMinus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1)} className="p-0.5 hover:bg-gray-200 rounded">
                              <FiPlus size={12} />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatRupiah(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleContinueShopping}
                className="mt-3 w-full text-center px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold text-sm"
              >
                Lanjutkan Berbelanja
              </button>
            </div>

            {/* Order Summary */}
            <div className="h-fit">
              <div className="bg-white rounded-2xl p-5 lg:sticky lg:top-24">
                <h2 className="text-base font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>
                <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({selectedItems.size} item)</span>
                    <span className="font-semibold">{formatRupiah(getSelectedTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pengiriman</span>
                    <span className="text-gray-400 text-xs font-medium">Dihitung di checkout</span>
                  </div>
                </div>
                <div className="flex justify-between mb-4 font-bold text-base">
                  <span>Total</span>
                  <span>{formatRupiah(getSelectedTotal())}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading || selectedItems.size === 0}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Memproses...' : `Checkout (${selectedItems.size} item)`}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-3">Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan kami</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout Bar */}
      {cart.length > 0 && isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden z-40 shadow-lg">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Total ({selectedItems.size} dipilih)</p>
            <p className="text-base font-black text-gray-900">{formatRupiah(getSelectedTotal())}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || selectedItems.size === 0}
            className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Memproses...' : 'Checkout'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
