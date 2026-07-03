import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex gap-2 items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '-0.3s' }} />
          <span className="w-3 h-3 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '-0.15s' }} />
          <span className="w-3 h-3 rounded-full bg-yellow-500 animate-bounce" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Double check the role/type
  if (user.role !== 'admin' && user.type !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
