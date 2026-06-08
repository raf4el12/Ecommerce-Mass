// components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ message = 'Cargando...', size = "medium", fullScreen = false }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const containerClass = fullScreen ? 'loading-overlay' : 'loading-container';

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className={`loading-spinner ${sizeClasses[size]}`} aria-hidden="true">
        <div className="spinner"></div>
      </div>
      <span className="sr-only">{message}</span>
      {!fullScreen && <p className="loading-text">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;