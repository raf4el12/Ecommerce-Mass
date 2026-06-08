import React from 'react';

const Card = React.forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div 
      ref={ref}
      className={`bg-surface-container-lowest rounded-2xl p-4 lg:px-6 shadow-level-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
