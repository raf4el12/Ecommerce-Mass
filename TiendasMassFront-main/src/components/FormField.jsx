// components/FormField.jsx
import React from 'react';

const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  children,
  className = '',
  ...props
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const hasError = error && error.length > 0;

  return (
    <div className={`form-group ${className}`}>
      <label
        htmlFor={fieldId}
        className={`form-label ${hasError ? 'label-error' : ''}`}
      >
        {label}
        {required && <span aria-label="requerido"> *</span>}
      </label>

      {children ? (
        React.cloneElement(children, {
          id: fieldId,
          value,
          onChange,
          onBlur,
          'aria-describedby': hasError ? errorId : undefined,
          'aria-invalid': hasError,
          'aria-required': required,
          ...props
        })
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`form-input ${hasError ? 'input-error' : ''}`}
          aria-describedby={hasError ? errorId : undefined}
          aria-invalid={hasError}
          aria-required={required}
          {...props}
        />
      )}

      {hasError && (
        <div
          id={errorId}
          className="error-messages"
          role="alert"
          aria-live="polite"
        >
          {error.map((errorMsg, index) => (
            <span key={index} className="error-text">
              {errorMsg}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormField;