import React from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const Modal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info',
  actions = [],
  onClose = () => {}
}) => {
  if (!isOpen) return null;

  const getModalStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: FiCheckCircle,
          iconColor: 'text-green-500',
          headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800',
          borderColor: 'border-green-200',
          accentBg: 'bg-green-100/30',
          dotColor: 'bg-green-500',
        };
      case 'error':
        return {
          icon: FiAlertCircle,
          iconColor: 'text-red-500',
          headerBg: 'bg-gradient-to-r from-red-50 to-rose-50',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800',
          borderColor: 'border-red-200',
          accentBg: 'bg-red-100/30',
          dotColor: 'bg-red-500',
        };
      case 'warning':
        return {
          icon: FiAlertTriangle,
          iconColor: 'text-yellow-500',
          headerBg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          accentBg: 'bg-yellow-100/30',
          dotColor: 'bg-yellow-500',
        };
      case 'info':
      default:
        return {
          icon: FiInfo,
          iconColor: 'text-blue-500',
          headerBg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          accentBg: 'bg-blue-100/30',
          dotColor: 'bg-blue-500',
        };
    }
  };

  const styles = getModalStyles(type);
  const Icon = styles.icon;

  return (
    <>
      {/* Backdrop dengan blur */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full animate-modalIn pointer-events-auto border ${styles.borderColor}`}>
          {/* Decorative top border */}
          <div className={`h-1 ${styles.dotColor} rounded-t-2xl`}></div>

          {/* Header dengan gradient */}
          <div className={`${styles.headerBg} px-6 py-5 flex items-start justify-between border-b ${styles.borderColor}`}>
            <div className="flex items-start space-x-4">
              <div className={`${styles.accentBg} p-3 rounded-full flex-shrink-0`}>
                <Icon className={`${styles.iconColor}`} size={28} />
              </div>
              <h2 className={`${styles.titleColor} text-xl font-bold`}>{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <p className={`${styles.messageColor} text-base leading-relaxed`}>
              {message}
            </p>
          </div>

          {/* Footer */}
          {actions.length > 0 && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-2xl flex gap-3 justify-end">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick?.();
                    if (action.closeAfter !== false) onClose();
                  }}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                    action.variant === 'primary'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg hover:scale-105'
                      : action.variant === 'danger'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;
