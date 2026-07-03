import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  const openModal = useCallback((config) => {
    const id = Date.now();
    setModals(prev => [...prev, { id, ...config }]);
    return id;
  }, []);

  const closeModal = useCallback((id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const showConfirm = useCallback((title, message, onConfirm, onCancel) => {
    return openModal({
      title,
      message,
      type: 'warning',
      actions: [
        {
          label: 'Batal',
          variant: 'secondary',
          onClick: onCancel,
        },
        {
          label: 'Yakin',
          variant: 'danger',
          onClick: onConfirm,
        }
      ]
    });
  }, [openModal]);

  const showAlert = useCallback((title, message, type = 'info', onOk) => {
    return openModal({
      title,
      message,
      type,
      actions: [
        {
          label: 'OK',
          variant: 'primary',
          onClick: onOk,
        }
      ]
    });
  }, [openModal]);

  const value = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    showConfirm,
    showAlert,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
