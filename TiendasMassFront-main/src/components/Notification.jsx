// components/Notification.jsx
import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const Notification = ({
  type = 'info',
  message,
  onClose,
  autoClose = true,
  duration = 5000,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const icons = {
    success: <CheckCircle2 aria-hidden="true" size={18} />,
    error: <AlertTriangle aria-hidden="true" size={18} />,
    warning: <AlertTriangle aria-hidden="true" size={18} />,
    info: <Info aria-hidden="true" size={18} />
  };

  const roles = {
    success: 'status',
    error: 'alert',
    warning: 'alert',
    info: 'status'
  };

  const liveRegions = {
    success: 'polite',
    error: 'assertive',
    warning: 'assertive',
    info: 'polite'
  };

  return (
    <div
      className={`notification notification-${type} notification-${position}`}
      role={roles[type]}
      aria-live={liveRegions[type]}
      aria-atomic="true"
    >
      <div className="notification-content">
        <span className="notification-icon">
          {icons[type]}
        </span>
        <span className="notification-message">{message}</span>
        {onClose && (
          <button
            className="notification-close"
            onClick={onClose}
            aria-label="Cerrar notificación"
          >
            <X aria-hidden="true" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
