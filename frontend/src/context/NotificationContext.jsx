import React, { createContext, useContext, useCallback } from 'react';
import Swal from 'sweetalert2';

const NotificationContext = createContext();

const showCustomAlert = (title, message, type = 'info', duration = 2000) => {
  const styleConfig = {
    success: {
      icon: 'success',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      iconColor: '#fff',
      confirmButtonColor: '#059669',
      confirmButtonBgColor: '#059669',
      confirmButtonTextColor: '#fff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        htmlContainer: 'text-white text-base',
        title: 'text-white text-2xl font-bold',
        confirmButton: 'font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all',
      },
    },
    error: {
      icon: 'error',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      iconColor: '#fff',
      confirmButtonColor: '#dc2626',
      confirmButtonBgColor: '#dc2626',
      confirmButtonTextColor: '#fff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        htmlContainer: 'text-white text-base',
        title: 'text-white text-2xl font-bold',
        confirmButton: 'font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all',
      },
    },
    warning: {
      icon: 'warning',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      iconColor: '#fff',
      confirmButtonColor: '#d97706',
      confirmButtonBgColor: '#d97706',
      confirmButtonTextColor: '#fff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        htmlContainer: 'text-white text-base',
        title: 'text-white text-2xl font-bold',
        confirmButton: 'font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all',
      },
    },
    info: {
      icon: 'info',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      iconColor: '#fff',
      confirmButtonColor: '#2563eb',
      confirmButtonBgColor: '#2563eb',
      confirmButtonTextColor: '#fff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        htmlContainer: 'text-white text-base',
        title: 'text-white text-2xl font-bold',
        confirmButton: 'font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all',
      },
    },
  };

  const config = styleConfig[type] || styleConfig.info;

  return Swal.fire({
    title: title,
    html: message,
    icon: config.icon,
    background: config.background,
    iconColor: config.iconColor,
    confirmButtonColor: config.confirmButtonBgColor,
    confirmButtonTextColor: config.confirmButtonTextColor,
    confirmButtonText: 'OK',
    allowOutsideClick: false,
    allowEscapeKey: true,
    showConfirmButton: true,
    customClass: config.customClass,
    timer: duration > 0 ? duration : undefined,
    timerProgressBar: duration > 0,
    willClose: () => {},
  });
};

// Custom styled confirmation dialog with SweetAlert2
const showConfirmAlert = (title, message, confirmButtonText = 'Hapus', cancelButtonText = 'Batal') => {
  return Swal.fire({
    title: title,
    html: message,
    icon: 'warning',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    iconColor: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonTextColor: '#fff',
    cancelButtonColor: 'rgba(255, 255, 255, 0.3)',
    cancelButtonTextColor: '#fff',
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    allowOutsideClick: false,
    allowEscapeKey: true,
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
      htmlContainer: 'text-white text-base',
      title: 'text-white text-2xl font-bold',
      confirmButton: 'font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all',
      cancelButton: 'font-bold px-8 py-3 rounded-lg border-2 border-white shadow-lg hover:shadow-xl transition-all hover:bg-white hover:bg-opacity-10',
    },
  });
};

export const NotificationProvider = ({ children }) => {
  const showSuccess = useCallback((message, duration = 2000) => {
    return showCustomAlert('Sukses', message, 'success', duration);
  }, []);

  const showError = useCallback((message, duration = 2000) => {
    return showCustomAlert('Error', message, 'error', duration);
  }, []);

  const showInfo = useCallback((message, duration = 2000) => {
    return showCustomAlert('Informasi', message, 'info', duration);
  }, []);

  const showWarning = useCallback((message, duration = 2000) => {
    return showCustomAlert('Peringatan', message, 'warning', duration);
  }, []);

  const showAlertSuccess = useCallback((title, message, duration = 2000) => {
    return showCustomAlert(title, message, 'success', duration);
  }, []);

  const showAlertError = useCallback((title, message, duration = 2000) => {
    return showCustomAlert(title, message, 'error', duration);
  }, []);

  const showAlertInfo = useCallback((title, message, duration = 2000) => {
    return showCustomAlert(title, message, 'info', duration);
  }, []);

  const showAlertWarning = useCallback((title, message, duration = 2000) => {
    return showCustomAlert(title, message, 'warning', duration);
  }, []);

  const showConfirm = useCallback((title, message, confirmButtonText = 'Hapus', cancelButtonText = 'Batal') => {
    return showConfirmAlert(title, message, confirmButtonText, cancelButtonText);
  }, []);

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showAlertSuccess,
    showAlertError,
    showAlertInfo,
    showAlertWarning,
    showConfirm,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
