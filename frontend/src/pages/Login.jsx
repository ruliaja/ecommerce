import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const { showError, showAlertSuccess } = useNotification();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!credentials.email || !credentials.password) {
      setError('Email dan password harus diisi');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      setError('Email tidak valid');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Try regular user login first
      const response = await login(credentials.email, credentials.password);

      if (response.status === 'success') {
        // Check if the user is an admin (from users table with admin role)
        if (response.user?.role === 'admin') {
          showAlertSuccess('Admin Login', `Selamat datang kembali, ${response.user.name}!`, 2000);
          setTimeout(() => {
            navigate('/admin');
          }, 2500);
        } else {
          showAlertSuccess('Selamat Datang! 👋', `Halo ${response.user.name}, Anda berhasil login!`, 2000);
          setTimeout(() => {
            navigate('/');
          }, 2500);
        }
        return;
      }

      // If regular login fails, try admin login (admins table)
      const adminResponse = await adminLogin(credentials.email, credentials.password);

      if (adminResponse.status === 'success') {
        showAlertSuccess('Admin Login', `Selamat datang kembali, ${adminResponse.user.name}!`, 2000);
        setTimeout(() => {
          navigate('/admin');
        }, 2500);
        return;
      }

      // Both failed
      showError(adminResponse.message || response.message);
      setError(response.message || 'Email atau password salah');
    } catch (err) {
      const errorMsg = 'Terjadi kesalahan saat login';
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OutFitKita</h1>
          <p className="text-gray-600">Masuk ke akun Anda</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Masukkan email Anda"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Masukkan password"
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-700">
              <input type="checkbox" className="mr-2" />
              Ingat saya
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">atau</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Register Link */}
        <p className="text-center text-gray-600">
          Belum punya akun?{' '}
          <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
