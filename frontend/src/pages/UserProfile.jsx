import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCamera, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import UserProfileLayout from '../layouts/UserProfileLayout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getUserProfile, updateUserProfile } from '../api/userProfileService';
import { getDefaultAddress } from '../api/addressService';
import axiosInstance from '../api/axiosInstance';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [displayAddress, setDisplayAddress] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadAddress();
    }
  }, [user?.id]);

  const loadAddress = async () => {
    try {
      const response = await getDefaultAddress(user.id);
      if (response.status === 'success' && response.data) {
        setDisplayAddress(response.data.address || '');
      }
    } catch (error) {
      console.error('Error loading address:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile(user.id);
      
      if (response.status === 'success') {
        const data = response.data;
        setFormData({
          username: data.username || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
        if (data.profile_image) {
          setProfileImagePreview(data.profile_image);
        }
      } else {
        showError('Gagal memuat profil');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Terjadi kesalahan saat memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!profileImage) return null;

    try {
      const formDataForUpload = new FormData();
      formDataForUpload.append('image', profileImage);

      const response = await axiosInstance.post(
        'https://outfitkita.my.id/api/index.php?action=upload_image',
        formDataForUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.status === 'success') {
        return response.data.image_url;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Gagal mengunggah gambar');
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      showError('Nama dan email harus diisi');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = null;

      if (profileImage) {
        imageUrl = await uploadImage();
      }

      const updateData = {
        ...formData,
        profile_image: imageUrl || profileImagePreview
      };

      const response = await updateUserProfile(user.id, updateData);

      if (response.status === 'success') {
        showSuccess('Profil berhasil diperbarui!');
        setProfileImage(null);
        
        // Update auth context with complete user data
        if (response.data) {
          const updatedUser = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            address: response.data.address || '',
            profile_image: response.data.profile_image || null,
            role: response.data.role || user.role
          };
          updateUser(updatedUser);
        }
        
        // Reload profile to ensure all data is synced
        setTimeout(() => {
          loadProfile();
          loadAddress();
        }, 500);
      } else {
        showError(response.message || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Terjadi kesalahan saat memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserProfileLayout currentPage="profile">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition font-medium text-sm mb-3"
          >
            <FiArrowLeft size={18} />
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Profil Saya</h1>
          <p className="text-sm text-gray-600">Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Image Section */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser size={32} className="text-gray-400" />
                  )}
                </div>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-600 transition"
                >
                  <FiCamera size={14} />
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm mb-1">Pilih Gambar</p>
                <p className="text-xs text-gray-600">Ukuran: maks. 1 MB | Format: JPEG, PNG</p>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                />
              </div>
            </div>

            {/* Nama */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Masukkan email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Masukkan nomor telepon"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Alamat</h3>
                  {displayAddress ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {displayAddress}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Belum ada alamat</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile/address')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium text-sm rounded-lg hover:bg-blue-600 transition ml-4"
                >
                  <FiEdit2 size={16} />
                  Edit
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-500 text-white font-medium text-sm rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UserProfileLayout>
  );
};

export default UserProfile;
