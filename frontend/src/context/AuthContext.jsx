import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, loginAdmin as loginAdminService, logoutUser as logoutUserService } from '../api/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on app startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      
      if (response.status === 'success') {
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } else {
        setIsAuthenticated(false);
        return response;
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const response = await loginAdminService({ email, password });
      
      if (response.status === 'success') {
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } else {
        setIsAuthenticated(false);
        return response;
      }
    } catch (error) {
      console.error('❌ Error during admin login:', error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    logoutUserService();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    const newUser = {
      ...user,
      ...updatedUserData
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        adminLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
