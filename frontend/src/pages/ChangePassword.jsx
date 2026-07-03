import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import UserProfileLayout from '../layouts/UserProfileLayout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { changePassword } from '../api/userProfileService';

// Separate component to prevent re-rendering issues
const PasswordInput = ({ label, name, value, show, onToggle, placeholder, disabled, onChange }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  </div>
);

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.oldPassword.trim()) {
      showError('Password lama harus diisi');
      return false;
    }

    if (!formData.newPassword.trim()) {
      showError('Password baru harus diisi');
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      showError('Konfirmasi password harus diisi');
      return false;
    }

    if (formData.newPassword.length < 6) {
      showError('Password baru harus minimal 6 karakter');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showError('Password baru tidak cocok dengan konfirmasi password');
      return false;
    }

    if (formData.oldPassword === formData.newPassword) {
      showError('Password baru tidak boleh sama dengan password lama');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await changePassword(
        user.id,
        formData.oldPassword,
        formData.newPassword
      );

      if (response.status === 'success') {
        showSuccess('Password berhasil diubah!');
        // Clear form
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Redirect to profile after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        showError(response.message || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Terjadi kesalahan saat mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserProfileLayout currentPage="password">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition"
          >
            <FiArrowLeft size={18} />
            Kembali
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiLock size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ubah Password</h1>
              <p className="text-gray-600">Perbarui password akun Anda untuk keamanan lebih baik</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Old Password */}
            <PasswordInput
              label="Password Lama"
              name="oldPassword"
              value={formData.oldPassword}
              show={showOldPassword}
              onToggle={() => setShowOldPassword(!showOldPassword)}
              placeholder="Masukkan password lama Anda"
              disabled={loading}
              onChange={handleInputChange}
            />

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* New Password */}
            <PasswordInput
              label="Password Baru"
              name="newPassword"
              value={formData.newPassword}
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              placeholder="Masukkan password baru (minimal 6 karakter)"
              disabled={loading}
              onChange={handleInputChange}
            />

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className={`h-1 flex-1 rounded-full ${
                    formData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-1 flex-1 rounded-full ${
                    formData.newPassword.length >= 10 ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-1 flex-1 rounded-full ${
                    /[A-Z]/.test(formData.newPassword) && /[0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">
                  {formData.newPassword.length < 6 && '✓ Minimal 6 karakter'}
                  {formData.newPassword.length >= 6 && formData.newPassword.length < 10 && '✓ Gunakan huruf besar dan angka untuk keamanan lebih baik'}
                  {formData.newPassword.length >= 10 && /[A-Z]/.test(formData.newPassword) && /[0-9]/.test(formData.newPassword) && '✓ Password kuat'}
                </p>
              </div>
            )}

            {/* Confirm Password */}
            <PasswordInput
              label="Konfirmasi Password Baru"
              name="confirmPassword"
              value={formData.confirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              placeholder="Masukkan ulang password baru"
              disabled={loading}
              onChange={handleInputChange}
            />

            {/* Password Match Indicator */}
            {formData.newPassword && formData.confirmPassword && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                formData.newPassword === formData.confirmPassword
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {formData.newPassword === formData.confirmPassword
                  ? '✓ Password cocok'
                  : '✗ Password tidak cocok'}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* Security Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900 text-sm">Tips Keamanan:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Gunakan password yang kuat dengan kombinasi huruf besar, kecil, dan angka</li>
                <li>Jangan gunakan tanggal lahir atau nama sebagai password</li>
                <li>Hindari menggunakan password yang sama di beberapa akun</li>
                <li>Ubah password secara berkala untuk keamanan maksimal</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                disabled={loading}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !formData.oldPassword || !formData.newPassword || !formData.confirmPassword}
                className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UserProfileLayout>
  );
};

export default ChangePassword;
