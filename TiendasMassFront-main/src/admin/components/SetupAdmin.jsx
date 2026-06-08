import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { validateUserForm, validateField } from '../../utils/usuariosvalidaciones';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const API_URL = "http://localhost:5001";

const SetupAdmin = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/setup/status`);
      const data = await response.json();
      
      setNeedsSetup(data.needsSetup);
      setCheckingSetup(false);

      if (!data.needsSetup) {
        Swal.fire({
          icon: 'info',
          title: 'Sistema ya configurado',
          text: 'El sistema ya tiene un administrador. Serás redirigido al login.',
          timer: 3000,
          showConfirmButton: false
        });
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error al verificar estado del sistema:', error);
      setCheckingSetup(false);
      setNeedsSetup(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    const error = validateField(name, value, formData);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error ? [error] : null
    }));
  };

  const validateForm = () => {
    const formDataWithRole = { ...formData, rol: 'Administrador' };
    const errors = validateUserForm(formDataWithRole);
    
    const formattedErrors = {};
    for (const key in errors) {
      formattedErrors[key] = [errors[key]];
    }
    
    setFieldErrors(formattedErrors);
    
    if (Object.keys(formattedErrors).length > 0) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const userData = { ...formData };
      delete userData.confirmPassword;

      const response = await fetch(`${API_URL}/api/setup/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Administrador Creado Exitosamente!',
          text: `El administrador ${formData.nombre} ha sido creado. Ahora puedes iniciar sesión.`,
          confirmButtonText: 'Ir al Login'
        }).then(() => {
          navigate('/admin');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al Crear Administrador',
          text: data.error || 'No se pudo crear el administrador',
          confirmButtonText: 'Intentar de nuevo'
        });
      }
    } catch (error) {
      console.error('Error al crear administrador:', error);
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

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface fade-in">
        <div className="w-12 h-12 border-4 border-trust-blue/30 border-t-trust-blue rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-body-lg">Verificando estado del sistema...</p>
      </div>
    );
  }

  if (!needsSetup) return null;

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 py-12 relative bg-cover bg-center"
      style={{ backgroundImage: 'url(/images/login-bg.png)' }}
    >
      <div className="absolute inset-0 bg-trust-blue/30 backdrop-blur-[2px]"></div>

      <Card className="w-full max-w-4xl relative z-10 !p-0 shadow-2xl bg-surface/95 backdrop-blur-md border border-outline-variant/30 fade-in overflow-hidden">
        <div className="bg-trust-blue p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-headline-lg text-headline-lg mb-2">Configuración Inicial</h1>
          <p className="font-body-lg text-white/80">
            Bienvenido a Tiendas Mass. Necesitamos crear el primer administrador del sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-headline-sm text-headline-sm text-trust-blue border-b border-outline-variant pb-2">
                Datos de Acceso
              </h3>
              
              <Input
                label="Nombre Completo *"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Juan Pérez"
                error={fieldErrors.nombre ? fieldErrors.nombre[0] : null}
                leadingIcon={User}
                disabled={loading}
                required
              />
              <p className="text-xs text-on-surface-variant -mt-4 ml-1">2-100 caracteres, solo letras y espacios</p>

              <Input
                label="Correo Electrónico *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@tiendamass.com"
                error={fieldErrors.email ? fieldErrors.email[0] : null}
                leadingIcon={Mail}
                disabled={loading}
                required
              />
              <p className="text-xs text-on-surface-variant -mt-4 ml-1">Máximo 254 caracteres, formato válido</p>

              <div className="relative">
                <Input
                  label="Contraseña *"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  error={fieldErrors.password ? fieldErrors.password[0] : null}
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
                <p className="text-xs text-on-surface-variant mt-1 ml-1">8-128 caracteres, mayúsculas, minúsculas, números y símbolos</p>
              </div>

              <div className="relative">
                <Input
                  label="Confirmar Contraseña *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  error={fieldErrors.confirmPassword ? fieldErrors.confirmPassword[0] : null}
                  leadingIcon={Lock}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-10 text-on-surface-variant hover:text-trust-blue transition-colors focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <p className="text-xs text-on-surface-variant mt-1 ml-1">Debe coincidir con la contraseña</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-headline-sm text-headline-sm text-trust-blue border-b border-outline-variant pb-2">
                Datos de Contacto
              </h3>

              <Input
                label="Teléfono"
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="+51 999 999 999"
                error={fieldErrors.telefono ? fieldErrors.telefono[0] : null}
                leadingIcon={User}
                disabled={loading}
              />
              <p className="text-xs text-on-surface-variant -mt-4 ml-1">7-15 caracteres, solo números y +</p>

              <Input
                label="Ciudad"
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                placeholder="Lima"
                error={fieldErrors.ciudad ? fieldErrors.ciudad[0] : null}
                leadingIcon={User}
                disabled={loading}
              />
              <p className="text-xs text-on-surface-variant -mt-4 ml-1">2-100 caracteres, solo letras y espacios</p>

              <Input
                label="Dirección"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Av. Principal 123"
                error={fieldErrors.direccion ? fieldErrors.direccion[0] : null}
                leadingIcon={User}
                disabled={loading}
              />
              <p className="text-xs text-on-surface-variant -mt-4 ml-1">5-200 caracteres alfanuméricos</p>

              <Input
                label="Código Postal"
                type="text"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleInputChange}
                placeholder="15001"
                error={fieldErrors.codigoPostal ? fieldErrors.codigoPostal[0] : null}
                leadingIcon={User}
                disabled={loading}
              />
              <p className="text-xs text-on-surface-variant -mt-4 ml-1">4-10 caracteres alfanuméricos</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 max-w-sm">
              <CheckCircle2 className="text-success shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-label-bold text-label-bold text-on-surface">¿Qué se creará?</h4>
                <ul className="text-sm text-on-surface-variant mt-1 list-disc list-inside">
                  <li>Rol de Administrador Principal</li>
                  <li>Estado "Activo" en el sistema</li>
                  <li>Acceso total y completo</li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full md:w-auto min-h-[48px] px-8 text-lg"
              leadingIcon={<Save />}
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SetupAdmin;