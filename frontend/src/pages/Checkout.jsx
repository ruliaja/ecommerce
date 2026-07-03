import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { createOrder } from '../api/orderService';
import { getDefaultAddress } from '../api/addressService';
import { getPaymentSettings } from '../api/paymentSettingsService';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { cart, clearCart, removeFromCart, syncCartFromDatabase } = useCart();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const selectedItemIds = location.state?.selectedItemIds || [];
  const checkoutItems = selectedItemIds.length > 0 
    ? cart.filter(item => selectedItemIds.includes(item.cart_id))
    : cart;
  const [currentStep, setCurrentStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [addressMode, setAddressMode] = useState('automatic');
  const [databaseAddress, setDatabaseAddress] = useState('');
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    street: '',
    house_number: '',
    rt_rw: '',
    village: '',
    district: '',
    city: '',
    zipCode: '',
    shippingMethod: 'standard',
    paymentMethod: '',
    notes: '',
  });

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      showError('Silakan login terlebih dahulu untuk checkout');
      navigate('/login');
      return;
    }

    // Don't redirect to cart if order was just placed (cart cleared on purpose)
    if ((cart.length === 0 || selectedItemIds.length === 0) && !orderPlaced) {
      navigate('/cart');
      return;
    }

    // Fetch address from database
    const fetchAddress = async () => {
      try {
        if (user?.id) {
          const response = await getDefaultAddress(user.id);
          if (response.status === 'success' && response.data) {
            setDatabaseAddress(response.data);
            // Set automatic mode with database address and user data
            setFormData(prev => ({
              ...prev,
              fullName: response.data.recipient_name || user?.name || prev.fullName,
              email: user?.email || prev.email,
              phone: user?.phone || prev.phone,
              address: response.data.address || '',
              city: response.data.city || '',
              zipCode: response.data.zipCode || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching address:', error);
      }
    };

    fetchAddress();

    // Fetch payment settings
    const fetchPaymentSettings = async () => {
      try {
        const res = await getPaymentSettings(true);
        if (res.status === 'success' && res.data?.length > 0) {
          setPaymentSettings(res.data);
          // Auto-select the first payment method
          setSelectedPayment(res.data[0]);
          setFormData(prev => ({ ...prev, paymentMethod: res.data[0].id.toString() }));
        }
      } catch (e) {
        console.error('Failed to load payment settings:', e);
      }
    };
    fetchPaymentSettings();
  }, [cart, navigate, isAuthenticated, isLoading, showError, user?.id, user?.name, user?.email, user?.phone]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const shippingCosts = {
    standard: 15000,
    express: 35000,
    overnight: 75000,
  };

  const getCheckoutSubtotal = () => {
    return checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalAmount = () => {
    return getCheckoutSubtotal() + shippingCosts[formData.shippingMethod];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressModeChange = (mode) => {
    setAddressMode(mode);
    if (mode === 'automatic' && databaseAddress) {
      setFormData(prev => ({
        ...prev,
        fullName: databaseAddress.recipient_name || user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: databaseAddress.address || '',
        city: databaseAddress.city || '',
        zipCode: databaseAddress.zipCode || ''
      }));
    } else if (mode === 'manual') {
      setFormData(prev => ({
        ...prev,
        fullName: '',
        email: '',
        phone: '',
        address: '',
        street: '',
        house_number: '',
        rt_rw: '',
        village: '',
        district: '',
        city: '',
        zipCode: ''
      }));
    }
  };

  const validateForm = () => {
    // Skip city and zipCode validation if using automatic address
    const requiredFields = ['fullName', 'email', 'phone'];
    
    if (addressMode === 'manual') {
      requiredFields.push('street', 'city', 'zipCode');
    } else {
      requiredFields.push('address');
    }

    for (let field of requiredFields) {
      if (!formData[field]?.trim()) {
        showError(`${field === 'street' ? 'Nama Jalan' : field === 'address' ? 'Alamat' : field} tidak boleh kosong`);
        return false;
      }
    }

    if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      showError('Nomor telepon tidak valid');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Email tidak valid');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let finalAddress = formData.address;
      if (addressMode === 'manual') {
        finalAddress = `${formData.street}, No. ${formData.house_number || '-'}, RT/RW ${formData.rt_rw || '-'}, Kel. ${formData.village || '-'}, Kec. ${formData.district || '-'}`;
      }

      const orderData = {
        user_id: user?.id || 0,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: finalAddress,
        customer_city: formData.city,
        customer_zip: formData.zipCode,
        shipping_method: formData.shippingMethod,
        payment_method: selectedPayment?.bank_name || formData.paymentMethod,
        notes: formData.notes,
        items: checkoutItems.map(item => ({
          product_id: item.id,
          cart_id: item.cart_id || null,
          quantity: item.quantity,
          price: item.price,
          selected_size: item.selected_size || null,
          selected_color: item.selected_color || null,
        })),
        total_amount: getTotalAmount(),
        shipping_cost: shippingCosts[formData.shippingMethod],
      };

      console.log('📦 Order Data:', orderData);

      const response = await createOrder(orderData);

      console.log('📨 Backend Response:', response);

      if (response.status === 'success') {
        setOrderPlaced(true);
        showSuccess('Pesanan berhasil dibuat!');
        
        // Backend otomatis menghapus item yang di-checkout dari database
        if (typeof syncCartFromDatabase === 'function') {
          syncCartFromDatabase();
        } else if (checkoutItems.length === cart.length) {
          clearCart();
        }

        setTimeout(() => {
          navigate('/order-success', {
            state: {
              orderId: response.order_id,
              orderNumber: response.order_number,
              totalAmount: getTotalAmount(),
              selectedPayment: selectedPayment,
            },
          });
        }, 1500);
      } else {
        showError(response.message || 'Gagal membuat pesanan');
      }
    } catch (error) {
      console.error('❌ Order error:', error);
      showError('Terjadi kesalahan saat membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <FiArrowLeft size={20} />
            <span>Kembali</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(step => (
            <div
              key={step}
              className={`p-4 rounded-xl text-center font-bold transition ${
                step <= currentStep
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step === 1 ? 'Alamat' : step === 2 ? 'Pengiriman' : 'Pembayaran'}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8">
              {/* Step 1: Address */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Informasi Pengiriman
                  </h2>

                  {/* Address Mode Selection */}
                  {databaseAddress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Pilih Sumber Alamat</p>
                      <label className={`p-3 border-2 rounded-lg cursor-pointer transition flex items-center gap-3 ${
                        addressMode === 'automatic' ? 'border-blue-500 bg-white' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="addressMode"
                          value="automatic"
                          checked={addressMode === 'automatic'}
                          onChange={() => handleAddressModeChange('automatic')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Alamat Saya</p>
                          <p className="text-xs text-gray-600">Menggunakan alamat dari profil Anda</p>
                        </div>
                      </label>
                      <label className={`p-3 border-2 rounded-lg cursor-pointer transition flex items-center gap-3 ${
                        addressMode === 'manual' ? 'border-blue-500 bg-white' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="addressMode"
                          value="manual"
                          checked={addressMode === 'manual'}
                          onChange={() => handleAddressModeChange('manual')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Buat Baru</p>
                          <p className="text-xs text-gray-600">Masukkan alamat pengiriman baru</p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap"
                        readOnly={addressMode === 'automatic'}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black ${
                          addressMode === 'automatic' ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Masukkan email"
                        readOnly={addressMode === 'automatic'}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black ${
                          addressMode === 'automatic' ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Masukkan nomor telepon"
                        readOnly={addressMode === 'automatic'}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black ${
                          addressMode === 'automatic' ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {addressMode === 'manual' && (
                      <>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Jalan *
                          </label>
                          <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            placeholder="Contoh: Jl. Sudirman"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-1 sm:col-span-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">No. Rumah</label>
                            <input type="text" name="house_number" value={formData.house_number} onChange={handleInputChange} placeholder="Contoh: 12A" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">RT/RW</label>
                            <input type="text" name="rt_rw" value={formData.rt_rw} onChange={handleInputChange} placeholder="Contoh: 01/02" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Kelurahan</label>
                            <input type="text" name="village" value={formData.village} onChange={handleInputChange} placeholder="Contoh: Melawai" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Kecamatan</label>
                            <input type="text" name="district" value={formData.district} onChange={handleInputChange} placeholder="Contoh: Kebayoran Baru" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kota *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Masukkan kota"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kode Pos *
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            placeholder="Masukkan kode pos"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                          />
                        </div>
                      </>
                    )}
                    {addressMode === 'automatic' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kota
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kode Pos
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {addressMode === 'automatic' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alamat Lengkap *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        rows="4"
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700 focus:outline-none focus:border-black"
                      />
                      <p className="text-xs text-gray-500 mt-1">ℹ️ Alamat dari profil Anda (read-only)</p>
                    </div>
                  )}

                  {addressMode === 'automatic' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900">
                        <span className="font-semibold">⚠️ Perhatian:</span> Pastikan alamat Anda di profil sudah benar. Jika ingin mengubah, pilih "Alamat Manual" di atas.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Catatan (Opsional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Tambahkan catatan khusus jika ada"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold"
                  >
                    Lanjut ke Pengiriman
                  </button>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Pilih Metode Pengiriman
                  </h2>

                  <div className="space-y-3">
                    {Object.entries(shippingCosts).map(([method, cost]) => (
                      <label
                        key={method}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.shippingMethod === method
                            ? 'border-black bg-gray-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={method}
                            checked={formData.shippingMethod === method}
                            onChange={handleInputChange}
                            className="w-4 h-4"
                          />
                          <div className="grow">
                            <p className="font-bold text-gray-900 capitalize">
                              {method === 'standard'
                                ? 'Standar (3-5 hari)'
                                : method === 'express'
                                ? 'Ekspres (1-2 hari)'
                                : 'Kilat (1 hari)'}
                            </p>
                          </div>
                          <p className="font-bold text-gray-900">
                            {formatRupiah(cost)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="w-full border-2 border-gray-300 text-gray-900 py-3 rounded-xl hover:bg-gray-50 transition font-bold"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold"
                    >
                      Lanjut ke Pembayaran
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Pilih Metode Pembayaran
                  </h2>

                  {paymentSettings.length > 0 ? (
                    <div className="space-y-3">
                      {paymentSettings.map(bank => (
                        <label
                          key={bank.id}
                          className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedPayment?.id === bank.id
                              ? 'border-black bg-gray-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={bank.id}
                              checked={selectedPayment?.id === bank.id}
                              onChange={() => {
                                setSelectedPayment(bank);
                                setFormData(prev => ({ ...prev, paymentMethod: bank.id.toString() }));
                              }}
                              className="w-4 h-4 accent-black"
                            />
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{bank.bank_name}</p>
                              <p className="text-sm text-gray-500">{bank.account_number} &middot; {bank.account_holder}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm">Belum ada metode pembayaran yang tersedia.</p>
                      <p className="text-gray-400 text-xs mt-1">Hubungi admin untuk informasi lebih lanjut.</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      ℹ️ Setelah pesanan dibuat, Anda akan diarahkan ke halaman konfirmasi untuk upload bukti pembayaran.
                    </p>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full border-2 border-gray-300 text-gray-900 py-3 rounded-xl hover:bg-gray-50 transition font-bold"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading || !selectedPayment}
                      className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Memproses...' : 'Pesan Sekarang'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="h-fit">
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Ringkasan Pesanan
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {checkoutItems.map(item => (
                  <div key={`${item.id}-${item.selected_size}-${item.selected_color}`} className="flex justify-between text-sm">
                    <div className="text-gray-600">
                      <span>{item.name} x{item.quantity}</span>
                      {(item.selected_size || item.selected_color) && (
                        <span className="text-xs text-gray-400 block">
                          {[item.selected_size, item.selected_color].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(getCheckoutSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pengiriman</span>
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(
                      shippingCosts[formData.shippingMethod]
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-gray-900">
                  {formatRupiah(getTotalAmount())}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (currentStep === 1) setCurrentStep(2);
                    else if (currentStep === 2) setCurrentStep(3);
                    else handlePlaceOrder();
                  }}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Memproses...' : (currentStep === 3 ? 'Pesan Sekarang' : 'Lanjutkan')}
                </button>
                <button
                  onClick={() => navigate('/')}
                  disabled={loading}
                  className="w-full border-2 border-gray-200 text-gray-800 py-3 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition font-bold"
                >
                  Kembali Belanja
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
