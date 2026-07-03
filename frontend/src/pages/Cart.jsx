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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <FiArrowLeft size={20} />
            <span>Kembali</span>
          </button>
        </div>

        {!isAuthenticated ? (
          // Not Logged In
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Silakan Login Terlebih Dahulu</h2>
            <p className="text-gray-600 mb-6">Anda harus login untuk melihat dan mengelola keranjang belanja Anda</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition font-semibold"
            >
              Login Sekarang
            </button>
          </div>
        ) : cart.length === 0 ? (
          // Empty Cart
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Keranjang Anda Kosong</h2>
            <p className="text-gray-600 mb-6">Mulai berbelanja dan tambahkan produk ke keranjang Anda</p>
            <button
              onClick={handleContinueShopping}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition font-semibold"
            >
              Lanjutkan Berbelanja
            </button>
          </div>
        ) : (
          // Cart Content
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl overflow-hidden">
                {/* Select All */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === cart.length && cart.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.size === cart.length && cart.length > 0
                        ? `Batalkan Pilih Semua (${selectedItems.size})`
                        : `Pilih Semua (${selectedItems.size}/${cart.length})`}
                    </span>
                  </div>

                  {/* Delete Selected Button - Show when at least one item is selected */}
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleDeleteAll}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                    >
                      <FiTrash2 size={16} />
                      {selectedItems.size === cart.length ? 'Hapus Semua' : 'Hapus Terpilih'} ({selectedItems.size})
                    </button>
                  )}
                </div>

                {cart.map((item, index) => (
                  <div
                    key={item.cart_id || item.id}
                    className={`p-6 flex gap-6 items-start ${index > 0 ? 'border-t border-gray-200' : ''} ${
                      selectedItems.has(item.cart_id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.cart_id)}
                        onChange={() => handleSelectItem(item.cart_id)}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>

                    {/* Product Image */}
                    <div className="w-24 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={item.image_url || item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="grow">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                      {(item.selected_size || item.selected_color) && (
                        <div className="flex items-center gap-2 mb-1">
                          {item.selected_size && (
                            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded">
                              {item.selected_size}
                            </span>
                          )}
                          {item.selected_color && (
                            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded">
                              {item.selected_color}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mb-4">{item.category}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col justify-between items-end">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.cart_id, item.quantity - 1)
                          }
                          className="p-1 hover:bg-gray-200 rounded transition"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.cart_id, item.quantity + 1)
                          }
                          className="p-1 hover:bg-gray-200 rounded transition"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.cart_id)}
                        className="text-red-500 hover:text-red-700 p-2 transition"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-2">Subtotal</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Button */}
              <button
                onClick={handleContinueShopping}
                className="mt-6 w-full text-center px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition font-semibold"
              >
                Lanjutkan Berbelanja
              </button>
            </div>

            {/* Order Summary */}
            <div className="h-fit">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ringkasan Pesanan</h2>

                {/* Calculation */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal Dipilih</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(getSelectedTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pengiriman</span>
                    <span className="font-semibold text-gray-900">Dihitung di checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-semibold text-gray-900">Dihitung di checkout</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between mb-6 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-gray-900">{formatRupiah(getSelectedTotal())}</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : 'Lanjut ke Pembayaran'}
                </button>

                {/* Info */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan kami
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
