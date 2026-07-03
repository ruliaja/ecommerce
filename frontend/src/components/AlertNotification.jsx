import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

const AlertNotification = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info',
  duration = 3000,
  onClose = () => {}
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          setIsClosing(false);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getAlertStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: FiCheckCircle,
          iconColor: 'text-green-500',
          headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          accentBg: 'bg-green-100/40',
          topBorder: 'bg-green-500',
          Icon: FiCheckCircle,
        };
      case 'error':
        return {
          icon: FiAlertCircle,
          iconColor: 'text-red-500',
          headerBg: 'bg-gradient-to-r from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          accentBg: 'bg-red-100/40',
          topBorder: 'bg-red-500',
          Icon: FiAlertCircle,
        };
      case 'warning':
        return {
          icon: FiAlertTriangle,
          iconColor: 'text-yellow-500',
          headerBg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          borderColor: 'border-yellow-200',
          accentBg: 'bg-yellow-100/40',
          topBorder: 'bg-yellow-500',
          Icon: FiAlertTriangle,
        };
      case 'info':
      default:
        return {
          icon: FiInfo,
          iconColor: 'text-blue-500',
          headerBg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200',
          accentBg: 'bg-blue-100/40',
          topBorder: 'bg-blue-500',
          Icon: FiInfo,
        };
    }
  };

  const styles = getAlertStyles(type);
  const Icon = styles.Icon;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={() => {
          setIsClosing(true);
          setTimeout(() => {
            onClose();
            setIsClosing(false);
          }, 300);
        }}
      />

      {/* Alert */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}>
        <div 
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto border ${styles.borderColor} transition-all duration-300 transform ${
            isClosing 
              ? 'scale-90 opacity-0 -translate-y-4' 
              : 'scale-100 opacity-100 translate-y-0'
          } ${!isClosing ? 'animate-modalIn' : ''}`}
        >
          {/* Top accent line */}
          <div className={`h-2 ${styles.topBorder} rounded-t-2xl`}></div>

          {/* Content */}
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className={`${styles.accentBg} p-4 rounded-full mb-4`}>
                <Icon className={`${styles.iconColor}`} size={40} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                {message}
              </p>

              {/* Close button hint atau auto close indicator */}
              {duration > 0 && (
                <div className="text-sm text-gray-500">
                  Menutup otomatis dalam {duration / 1000} detik...
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsClosing(true);
              setTimeout(() => {
                onClose();
                setIsClosing(false);
              }, 300);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
      </div>
    </>
  );
};

export default AlertNotification;
