// CompanyLogo.jsx
import React from 'react';
import logo from '../../assets/logo.png'; 

function CompanyLogo() {
  return (
    <div className="flex justify-center w-full">
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-surface-container-low flex items-center justify-center shadow-sm overflow-hidden border border-outline-variant/20">
        <img 
          src={logo}
          alt="Logo de la empresa" 
          className="w-[80%] h-auto object-contain" 
        />
      </div>
    </div>
  );
}

export default CompanyLogo;