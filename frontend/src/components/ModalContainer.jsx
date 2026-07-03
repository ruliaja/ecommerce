import React from 'react';
import Modal from './Modal';
import { useModal } from '../context/ModalContext';

const ModalContainer = () => {
  const { modals, closeModal } = useModal();

  return (
    <>
      {modals.map((modal) => (
        <Modal
          key={modal.id}
          isOpen={true}
          title={modal.title}
          message={modal.message}
          type={modal.type || 'info'}
          actions={modal.actions}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </>
  );
};

export default ModalContainer;
