// LoginForm.jsx - Versión mejorada con validaciones completas
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../../context/userContext';
import Swal from 'sweetalert2';
import { validateLoginForm } from '../../utils/validators';
import Button from '../ui/Button';
import Input from '../ui/Input';

const API_URL = "http://localhost:5001";

function LoginForm({ switchToRegister, onOTPRequired }) {
  const navigate = useNavigate();
  const { login } = useUsuario();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Limpiar el error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos
    const validationErrors = validateLoginForm(formData);
    
    // Si hay errores de validación, mostrarlos en rojo debajo de cada campo
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Iniciando login...');

      const response = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(), // ✅ Normalizar email
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('📨 Respuesta del servidor:', {
        status: response.status,
        ok: response.ok,
        hasToken: !!data.token
      });

      if (response.ok) {
        console.log('✅ Credenciales válidas, solicitar OTP...');

        // Solicitar OTP en lugar de loguear directamente
        try {
          const otpResponse = await fetch(`${API_URL}/api/auth/otp/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email.trim().toLowerCase()
            })
          });

          if (otpResponse.ok) {
            console.log('✅ OTP solicitado, mostrando formulario de verificación');
            // Mostrar pantalla de OTP
            if (onOTPRequired) {
              onOTPRequired(formData.email.trim().toLowerCase());
            }
          } else {
            throw new Error('No se pudo solicitar OTP');
          }
        } catch (error) {
          console.error('❌ Error al solicitar OTP:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar el código OTP'
          });
        }
      } else {
        // Manejar errores del servidor
        const errorMessage = data.message || data.error || 'Credenciales inválidas';

        console.log('❌ Login falló:', {
          status: response.status,
          message: errorMessage
        });

        Swal.fire({
          icon: 'error',
          title: getErrorTitle(response.status),
          text: errorMessage
        });
      }

    } catch (error) {
      console.error('❌ Error de red:', error);

      let errorMessage = 'Error de conexión. Verifica tu internet.';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'No se puede conectar al servidor. ¿Está funcionando el backend?';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Función auxiliar para títulos de error más descriptivos
  const getErrorTitle = (status) => {
    switch (status) {
      case 400: return 'Datos inválidos';
      case 401: return 'Credenciales incorrectas';
      case 403: return 'Acceso denegado';
      case 404: return 'Usuario no encontrado';
      case 500: return 'Error del servidor';
      default: return 'Error de autenticación';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center">
        <h2 className="font-headline-lg text-headline-lg text-trust-blue">Iniciar Sesión</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          id="login-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="ejemplo@correo.com"
          disabled={isLoading}
          error={errors.email ? errors.email[0] : null}
          leadingIcon={<span className="material-symbols-outlined">mail</span>}
        />

        <Input
          label="Contraseña"
          id="login-password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="********"
          disabled={isLoading}
          error={errors.password ? errors.password[0] : null}
          leadingIcon={<span className="material-symbols-outlined">lock</span>}
        />

        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={formData.remember}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-4 h-4 rounded border-outline-variant text-trust-blue focus:ring-trust-blue"
            />
            <span className="font-body-md text-body-md text-on-surface">Recordarme</span>
          </label>
          <a href="#" onClick={(e) => e.preventDefault()} className="font-label-bold text-label-bold text-trust-blue hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-4"
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <div className="text-center mt-6">
          <p className="font-body-md text-body-md text-on-surface-variant">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={switchToRegister}
              disabled={isLoading}
              className="font-label-bold text-label-bold text-trust-blue hover:underline"
            >
              Regístrate
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;