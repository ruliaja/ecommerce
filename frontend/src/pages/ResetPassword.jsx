import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { resetPassword } from '../api/authService';
import { useNotification } from '../context/NotificationContext';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { showError, showAlertSuccess } = useNotification();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [credentials, setCredentials] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const validateForm = () => {
    if (!credentials.password || !credentials.confirmPassword) {
      setError('Semua field harus diisi');
      return false;
    }

    if (credentials.password.length < 6) {
      setError('Password harus minimal 6 karakter');
      return false;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setError('Password tidak cocok');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    if (!token) {
      showError('Token tidak valid');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, credentials.password);

      if (response.status === 'success') {
        showAlertSuccess('Password Berhasil Diubah! ✅', 'Sekarang Anda bisa login dengan password baru.', 2000);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        showError(response.message || 'Terjadi kesalahan saat reset password');
        if (response.status === 'error') {
          navigate('/forgot-password');
        }
      }
    } catch (error) {
      showError('Terjadi kesalahan saat reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Buat password baru untuk akun Anda</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={(e) => {
                  setCredentials(prev => ({
                    ...prev,
                    password: e.target.value
                  }));
                  setError('');
                }}
                placeholder="Masukkan password baru"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={(e) => {
                  setCredentials(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }));
                  setError('');
                }}
                placeholder="Ulangi password baru"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
