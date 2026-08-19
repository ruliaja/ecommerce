import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { forgotPassword } from '../api/authService';
import { useNotification } from '../context/NotificationContext';

const ForgotPassword = () => {
  const { showError, showAlertSuccess } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showError('Email harus diisi');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Email tidak valid');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email);

      if (response.status === 'success') {
        setSubmitted(true);
        showAlertSuccess('Email Terkirim! 📧', 'Silakan cek email Anda untuk instruksi reset password.', 3000);
      } else {
        showError(response.message || 'Terjadi kesalahan saat mengirim email');
      }
    } catch (error) {
      showError('Terjadi kesalahan saat mengirim email reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Back to Login */}
        <Link to="/login" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 text-sm font-medium">
          <FiArrowLeft className="mr-2" />
          Kembali ke Login
        </Link>

        {!submitted ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Lupa Password?</h1>
              <p className="text-gray-600">
                Masukkan email Anda dan kami akan mengirimkan link untuk reset password
              </p>
            </div>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Success Message */}
            <div className="text-center">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Cek Email Anda</h2>
              <p className="text-gray-600 mb-6">
                Kami telah mengirimkan link reset password ke <strong>{email}</strong>
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Link reset password berlaku selama 1 jam. 
                  Jika Anda tidak menerima email dalam beberapa menit, silakan cek folder spam Anda.
                </p>
              </div>

              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Kirim ulang email
              </button>
            </div>
          </>
        )}

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

export default ForgotPassword;
