import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { validateLoginForm } from '../../utils/validators';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL;

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.usuario));
        
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido Administrador!',
          text: `Hola ${data.usuario.nombre}`,
          timer: 2000,
          showConfirmButton: false
        });

        navigate('/admin/dashboard');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de Login',
          text: data.error || 'Credenciales incorrectas',
          confirmButtonText: 'Intentar de nuevo'
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonText: 'Intentar de nuevo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: 'url(/images/login-bg.png)' }}
    >
      <div className="absolute inset-0 bg-trust-blue/30 backdrop-blur-[2px]"></div>

      <Card className="w-full max-w-md relative z-10 !p-8 shadow-2xl bg-surface/95 backdrop-blur-md border border-outline-variant/30 fade-in">
        <div className="text-center mb-8">
          <h1 className="font-headline-lg text-headline-lg text-trust-blue">
            Panel Administrativo
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Inicia sesión para acceder al panel de administración de Tiendas Mass
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Correo Electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="admin@tiendamass.com"
            error={errors.email ? errors.email[0] : null}
            leadingIcon={Mail}
            disabled={loading}
            required
          />

          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              error={errors.password ? errors.password[0] : null}
              leadingIcon={Lock}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="absolute right-4 top-10 text-on-surface-variant hover:text-trust-blue transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full min-h-[48px] text-lg mt-4"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-2 border-t border-outline-variant/50 pt-6">
          <p className="text-sm font-medium text-trust-blue hover:underline cursor-pointer">
            ¿Problemas para acceder? Contacta al soporte técnico
          </p>
          <p className="text-xs text-on-surface-variant">
            Acceso restringido solo para administradores autorizados
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;