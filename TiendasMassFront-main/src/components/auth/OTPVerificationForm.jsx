import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../../context/userContext';
import Swal from 'sweetalert2';
import Button from '../ui/Button';

const API_URL = "http://localhost:5001";

function OTPVerificationForm({ email, onBackToLogin }) {
  const navigate = useNavigate();
  const { login } = useUsuario();
  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(600); // 10 minutos
  const [codigoEnviado, setCodigoEnviado] = useState(true);

  // Timer para el código OTP
  useEffect(() => {
    if (tiempoRestante <= 0) {
      setCodigoEnviado(false);
      return;
    }

    const timer = setInterval(() => {
      setTiempoRestante(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [tiempoRestante]);

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${minutos}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodigoChange = (e) => {
    const valor = e.target.value.replace(/\D/g, ''); // Solo números
    if (valor.length <= 6) {
      setCodigo(valor);
    }
  };

  const handleVerificarOTP = async (e) => {
    e.preventDefault();

    if (!codigo || codigo.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Código incompleto',
        text: 'Por favor ingresa los 6 dígitos del código'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/otp/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          codigo: codigo
        })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Verificación exitosa
        await Swal.fire({
          icon: 'success',
          title: '¡Verificado!',
          text: 'Tu identidad ha sido confirmada',
          timer: 1500,
          showConfirmButton: false
        });

        // Guardar datos del usuario
        await login(data, false);

        // Verificar si el usuario tiene rol de administrador
        const usuarioActual = data.usuario || data;
        const esAdmin = 
          (usuarioActual.rol && ["admin", "ADMIN", "Administrador", "administrador"].includes(usuarioActual.rol.nombre)) ||
          (usuarioActual.rol && usuarioActual.rol.id === 1) ||
          usuarioActual.es_admin || 
          usuarioActual.rol_id === 1;

        if (esAdmin) {
          navigate('/admin/dashboard');
        } else {
          // Redirigir a la página principal para usuarios normales
          navigate('/');
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Código inválido',
          text: data.error || 'El código OTP es incorrecto o ha expirado'
        });
        setCodigo('');
      }
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo verificar el código. Intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/otp/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (response.ok) {
        setTiempoRestante(600); // Reiniciar timer
        setCodigoEnviado(true);
        setCodigo('');

        Swal.fire({
          icon: 'success',
          title: 'Código reenviado',
          text: 'Se ha enviado un nuevo código a tu email',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo reenviar el código'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo reenviar el código'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center">
        <h2 className="font-headline-lg text-headline-lg text-trust-blue">Verificación</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Se ha enviado un código de 6 dígitos a:<br />
          <strong className="text-on-surface">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleVerificarOTP} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 items-center">
          <label htmlFor="otp-code" className="font-label-bold text-label-bold text-on-surface">
            Código de verificación
          </label>
          <input
            id="otp-code"
            type="text"
            value={codigo}
            onChange={handleCodigoChange}
            placeholder="000000"
            maxLength="6"
            disabled={isLoading || !codigoEnviado}
            className="w-48 text-center text-4xl tracking-widest bg-surface border-2 border-transparent focus:border-trust-blue rounded-lg py-sm font-headline-xl outline-none transition-colors disabled:opacity-50"
            autoFocus
          />
          <p className="font-label-md text-label-md mt-2">
            Código expira en: <span className={tiempoRestante < 60 ? 'text-sale-red font-bold' : 'text-on-surface-variant'}>
              {formatearTiempo(tiempoRestante)}
            </span>
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-4"
          disabled={isLoading || !codigoEnviado || codigo.length !== 6}
        >
          {isLoading ? 'Verificando...' : 'Verificar código'}
        </Button>
      </form>

      <div className="flex flex-col gap-3 items-center mt-4">
        {!codigoEnviado && (
          <p className="font-label-bold text-label-bold text-sale-red">El código ha expirado</p>
        )}
        
        <button
          type="button"
          onClick={handleReenviarCodigo}
          disabled={isLoading || (codigoEnviado && tiempoRestante > 300)}
          className="font-label-bold text-label-bold text-trust-blue hover:underline disabled:opacity-50 disabled:no-underline"
        >
          Reenviar código
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          disabled={isLoading}
          className="font-label-bold text-label-bold text-on-surface-variant hover:text-on-surface transition-colors mt-2"
        >
          Volver al login
        </button>
      </div>
    </div>
  );
}

export default OTPVerificationForm;
