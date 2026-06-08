import React from 'react';

const SkipLinks = () => {
  return (
    <nav aria-label="Enlaces de navegación rápida">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-trust-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
      >
        Ir al contenido principal
      </a>
      <a 
        href="#navigation" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-16 focus:left-4 focus:z-[9999] focus:bg-trust-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
      >
        Ir a la navegación
      </a>
      <a 
        href="#search" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-28 focus:left-4 focus:z-[9999] focus:bg-trust-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
      >
        Ir a la búsqueda
      </a>
      <a 
        href="#footer" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-40 focus:left-4 focus:z-[9999] focus:bg-trust-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
      >
        Ir al pie de página
      </a>
    </nav>
  );
};

export default SkipLinks;