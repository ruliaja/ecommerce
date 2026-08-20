import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGoogleAuthCallback } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        addNotification('Login Google dibatalkan', 'error');
        navigate('/login');
        return;
      }

      if (!code) {
        addNotification('Kode autentikasi tidak ditemukan', 'error');
        navigate('/login');
        return;
      }

      try {
        const result = await handleGoogleAuthCallback(code, state);
        
        if (result.status === 'success') {
          // Update auth context
          if (result.user) {
            localStorage.setItem('user', JSON.stringify(result.user));
          }
          
          addNotification(result.message || 'Login berhasil!', 'success');
          
          // Redirect based on user role
          if (result.user?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          addNotification(result.message || 'Login gagal', 'error');
          navigate('/login');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        addNotification('Terjadi kesalahan saat login', 'error');
        navigate('/login');
      }
    };

    processCallback();
  }, [searchParams, navigate, addNotification]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Memproses login Google...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GoogleCallback;
