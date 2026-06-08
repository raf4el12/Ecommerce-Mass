import React from 'react';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  icon,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-sm rounded-full font-label-bold text-label-bold transition-all duration-200 px-6 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-trust-blue text-on-primary hover:bg-trust-blue-dark shadow-level-1 hover:shadow-level-2',
    secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
    outline: 'border-2 border-trust-blue text-trust-blue hover:bg-trust-blue/5',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex items-center justify-center shrink-0">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
