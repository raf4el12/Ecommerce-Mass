// AuthContainer.jsx
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OTPVerificationForm from './OTPVerificationForm';
import CompanyLogo from './CompanyLogo';
import Card from '../ui/Card';
import bannerBg from '../../assets/bannerfondomass.png';

function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [emailParaOTP, setEmailParaOTP] = useState('');
  
  const switchView = () => {
    setIsLogin(!isLogin);
  };

  const handleOTPRequired = (email) => {
    setEmailParaOTP(email);
    setShowOTP(true);
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setEmailParaOTP('');
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-margin-mobile relative"
      style={{
        backgroundImage: `url(${bannerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay oscuro para darle más contraste al fondo y resaltar la tarjeta */}
      <div className="absolute inset-0 bg-surface-tint/40 backdrop-blur-[2px]"></div>

      <Card className="w-full max-w-[480px] p-6 lg:p-8 flex flex-col items-center gap-6 relative z-10 shadow-2xl">
        <CompanyLogo />
        
        <div className="w-full">
          {showOTP ? (
            <OTPVerificationForm 
              email={emailParaOTP} 
              onBackToLogin={handleBackToLogin}
            />
          ) : isLogin ? (
            <LoginForm 
              switchToRegister={switchView}
              onOTPRequired={handleOTPRequired}
            />
          ) : (
            <RegisterForm switchToLogin={switchView} />
          )}
        </div>
      </Card>
    </div>
  );
}

export default AuthContainer;