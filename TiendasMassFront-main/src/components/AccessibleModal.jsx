// components/AccessibleModal.jsx
import React, { useEffect, useRef } from 'react';

const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOverlayClick = true
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Guardar el elemento que tenía el foco
      previousFocusRef.current = document.activeElement;

      // Enfocar el modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';

      // Agregar event listener para ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';

        // Restaurar el foco anterior
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'modal-sm',
    medium: 'modal-md',
    large: 'modal-lg',
    full: 'modal-full'
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-content"
    >
      <div
        ref={modalRef}
        className={`modal-content ${sizeClasses[size]}`}
        tabIndex={-1}
        role="document"
      >
        <header className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
            type="button"
          >
            ×
          </button>
        </header>

        <div id="modal-content" className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AccessibleModal;