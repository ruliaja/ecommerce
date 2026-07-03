import React, { useState, useEffect, useCallback } from 'react';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import UserProfileLayout from '../layouts/UserProfileLayout';
import { getCurrentUser } from '../api/authService';
import { getDefaultAddress, createAddress, updateAddress } from '../api/addressService';
import { useNotification } from '../context/NotificationContext';

const AddressManagement = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    recipient_name: '',
    street: '',
    house_number: '',
    rt_rw: '',
    village: '',
    district: '',
    city: '',
    province: '',
    zipCode: '',
    label: 'Rumah'
  });

  const parseAddress = (fullAddress) => {
    const result = {
      street: fullAddress || '',
      house_number: '',
      rt_rw: '',
      village: '',
      district: ''
    };
    
    if (!fullAddress) return result;

    const regex = /^(.*),\s*No\.\s*(.*),\s*RT\/RW\s*(.*),\s*Kel\.\s*(.*),\s*Kec\.\s*(.*)$/;
    const match = fullAddress.match(regex);
    
    if (match) {
      result.street = match[1];
      result.house_number = match[2];
      result.rt_rw = match[3];
      result.village = match[4];
      result.district = match[5];
    }
    
    return result;
  };

  const fetchAddress = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await getDefaultAddress(user.id);
      if (response.status === 'success' && response.data) {
        const parsedAddress = parseAddress(response.data.address);
        setFormData({
          id: response.data.id || null,
          recipient_name: response.data.recipient_name || '',
          street: parsedAddress.street,
          house_number: parsedAddress.house_number,
          rt_rw: parsedAddress.rt_rw,
          village: parsedAddress.village,
          district: parsedAddress.district,
          city: response.data.city || '',
          province: response.data.province || '',
          zipCode: response.data.zipCode || '',
          label: response.data.label || 'Rumah'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat memuat alamat');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAddress();
  }, [user?.id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.street.trim() || !formData.recipient_name.trim() || !formData.city.trim() || !formData.province.trim() || !formData.zipCode.trim()) {
      showError('Semua field yang wajib harus diisi');
      return;
    }

    const fullAddress = `${formData.street}, No. ${formData.house_number || '-'}, RT/RW ${formData.rt_rw || '-'}, Kel. ${formData.village || '-'}, Kec. ${formData.district || '-'}`;

    try {
      setSaving(true);
      
      const payload = {
        user_id: user.id,
        recipient_name: formData.recipient_name,
        address: fullAddress,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        label: formData.label,
        is_default: true // Always set this form's address as default
      };

      let response;
      if (formData.id) {
        payload.address_id = formData.id;
        response = await updateAddress(payload);
      } else {
        response = await createAddress(payload);
      }

      if (response.status === 'success') {
        showSuccess('Alamat berhasil diperbarui');
        setTimeout(() => navigate('/profile'), 500);
      } else {
        showError(response.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }, [formData, user?.id, showSuccess, showError, navigate]);

  return (
    <UserProfileLayout currentPage="address">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition font-medium text-sm mb-3"
          >
            <FiArrowLeft size={18} />
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Kelola Alamat</h1>
          <p className="text-sm text-gray-600">Edit alamat pengiriman Anda</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                    Label Alamat
                  </label>
                  <select
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="Rumah">Rumah</option>
                    <option value="Kantor">Kantor</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Penerima *
                  </label>
                  <input
                    type="text"
                    id="recipient_name"
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama penerima"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Jalan *
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Contoh: Jl. Sudirman"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="house_number" className="block text-sm font-medium text-gray-700 mb-1">
                    No. Rumah
                  </label>
                  <input
                    type="text"
                    id="house_number"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleInputChange}
                    placeholder="Contoh: 12A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="rt_rw" className="block text-sm font-medium text-gray-700 mb-1">
                    RT/RW
                  </label>
                  <input
                    type="text"
                    id="rt_rw"
                    name="rt_rw"
                    value={formData.rt_rw}
                    onChange={handleInputChange}
                    placeholder="Contoh: 01/02"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-1">
                    Kelurahan
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Contoh: Melawai"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Contoh: Kebayoran Baru"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Kota/Kabupaten *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Pos *
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="Contoh: 12345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-red-500 text-white font-medium text-sm rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </UserProfileLayout>
  );
};

export default AddressManagement;

