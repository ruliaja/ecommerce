import axios from 'axios';

const API_URL = 'https://outfitkita.my.id/api/';

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}?action=register`, {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      username: userData.username
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat registrasi'
    };
  }
};

// Login User with JWT
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}?action=login`, {
      email: credentials.email,
      password: credentials.password
    });

    if (response.data.status === 'success') {
      // Simpan access token dan refresh token
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('token', response.data.access_token); // For backward compatibility
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token_type', response.data.token_type || 'Bearer');
    }

    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat login'
    };
  }
};

// Login Admin with JWT
export const loginAdmin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}?action=admin_login`, {
      email: credentials.email,
      password: credentials.password
    });

    if (response.data.status === 'success') {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat login admin'
    };
  }
};

// Logout User
export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_type');
};

// Verify Token
export const verifyToken = async () => {
  try {
    const response = await axios.post(`${API_URL}?action=verify_token`);
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Token tidak valid'
    };
  }
};

// Refresh Token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await axios.post(`${API_URL}?action=refresh_token`, {
      refresh_token: refreshToken
    });

    if (response.data.status === 'success') {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('token', response.data.access_token);
    }

    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal merefresh token'
    };
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}?action=forgot_password`, {
      email: email
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat mengirim email reset password'
    };
  }
};

// Reset Password
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}?action=reset_password`, {
      token: token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat reset password'
    };
  }
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Check if user is logged in
export const isLoggedIn = () => {
  return !!(localStorage.getItem('access_token') || localStorage.getItem('token'));
};

// ==================== OAUTH AUTHENTICATION ====================

// Get Google OAuth URL
export const getGoogleAuthUrl = async () => {
  try {
    const response = await axios.get(`${API_URL}?action=google_auth_url`);
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal mendapatkan URL autentikasi Google'
    };
  }
};

// Handle Google OAuth Callback
export const handleGoogleAuthCallback = async (code, state) => {
  try {
    const response = await axios.post(`${API_URL}?action=google_auth_callback`, {
      code: code,
      state: state
    });

    if (response.data.status === 'success') {
      // Simpan tokens dan user data
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('oauth_provider', response.data.oauth_provider || 'google');
    }

    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat login dengan Google'
    };
  }
};

// Redirect to Google OAuth login
export const redirectToGoogleLogin = async () => {
  const result = await getGoogleAuthUrl();
  if (result.status === 'success') {
    window.location.href = result.authUrl;
  } else {
    console.error('Failed to get Google Auth URL:', result.message);
  }
};
