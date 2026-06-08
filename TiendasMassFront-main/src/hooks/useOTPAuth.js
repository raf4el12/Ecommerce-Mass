// useOTPAuth.js
import { useState } from 'react';

const API_URL = "http://localhost:5001";

export const useOTPAuth = () => {
  const [step, setStep] = useState('login'); // 'login', 'otp'
  const [emailParaOTP, setEmailParaOTP] = useState('');

  const solicitarOTPPorEmail = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios/otp/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (response.ok) {
        setEmailParaOTP(email);
        setStep('otp');
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error al solicitar OTP:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const volverAlLogin = () => {
    setStep('login');
    setEmailParaOTP('');
  };

  return {
    step,
    emailParaOTP,
    solicitarOTPPorEmail,
    volverAlLogin
  };
};
