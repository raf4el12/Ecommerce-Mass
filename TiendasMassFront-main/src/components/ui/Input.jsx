import React from 'react';

const Input = React.forwardRef(({
  label,
  error,
  leadingIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || React.useId();
  
  return (
    <div className="flex flex-col gap-xs w-full">
      {label && (
        <label htmlFor={inputId} className="font-label-bold text-label-bold text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none text-on-surface-variant">
            {leadingIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm pr-sm font-body-md text-body-md text-on-surface placeholder:text-outline-variant ${
            leadingIcon ? 'pl-xl' : 'pl-md'
          } ${
            error 
              ? 'border-error focus:border-error' 
              : 'border-transparent focus:border-trust-blue'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="font-label-md text-label-md text-error">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
