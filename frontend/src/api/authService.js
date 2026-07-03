import axios from 'axios';

const API_URL = 'http://localhost/ecommerce/backend/api/index.php';

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

// Login User
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}?action=login`, {
      email: credentials.email,
      password: credentials.password
    });

    if (response.data.status === 'success') {
      // Simpan token dan user data ke localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat login'
    };
  }
};

// Login Admin
export const loginAdmin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}?action=admin_login`, {
      email: credentials.email,
      password: credentials.password
    });

    if (response.data.status === 'success') {
      localStorage.setItem('token', response.data.token);
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
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};
