import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Shield, Save, X as CloseIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { validateUserForm, validateField } from '../../utils/usuariosvalidaciones';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const API_URL = "http://localhost:5001";

const CrearAdmin = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    dni: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/api/roles`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        if (response.ok) {
          const rolesData = await response.json();
          setRoles(rolesData);
          const adminRol = rolesData.find(rol => 
            rol.nombre.toLowerCase().includes('admin') || 
            rol.nombre.toLowerCase().includes('administrador')
          );
          if (adminRol) {
            setSelectedRol(adminRol.id.toString());
          }
        }
      } catch (error) {
        console.error('Error al cargar roles:', error);
      }
    };
    cargarRoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name !== 'confirmPassword' && name !== 'dni') {
      const error = validateField(name, value, false);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    } else if (name === 'dni') {
      let error = null;
      if (!value || value.trim().length === 0) {
        error = 'El DNI es requerido';
      } else if (value.trim().length !== 8) {
        error = 'El DNI debe tener exactamente 8 dígitos';
      } else if (!/^\d+$/.test(value.trim())) {
        error = 'El DNI debe contener solo números';
      }
      setFieldErrors(prev => ({ ...prev, dni: error ? [error] : null }));
    } else {
      const error = value !== formData.password ? ['Las contraseñas no coinciden'] : null;
      setFieldErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const validateForm = () => {
    const errors = validateUserForm({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      direccion: formData.direccion,
      telefono: formData.telefono,
      ciudad: formData.ciudad,
      codigoPostal: formData.codigoPostal
    }, false);

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ['Las contraseñas no coinciden'];
    }

    if (!selectedRol) {
      errors.rol = ['Debe seleccionar un rol'];
    }

    if (!formData.dni || formData.dni.trim().length === 0) {
      errors.dni = ['El DNI es requerido'];
    } else if (formData.dni.trim().length !== 8) {
      errors.dni = ['El DNI debe tener exactamente 8 dígitos'];
    } else if (!/^\d+$/.test(formData.dni.trim())) {
      errors.dni = ['El DNI debe contener solo números'];
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const userData = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono || '',
        direccion: formData.direccion || '',
        ciudad: formData.ciudad || '',
        codigoPostal: formData.codigoPostal || '',
        rolId: parseInt(selectedRol),
        estadoId: 1,
        tipoClienteId: 1,
        persona: {
          nombres: formData.nombre,
          numeroDocumento: formData.dni
        }
      };

      const response = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Usuario Administrador Creado!',
          text: `El usuario ${formData.nombre} ha sido creado exitosamente`,
          confirmButtonText: 'Continuar'
        });
        setFormData({
          nombre: '',
          email: '',
          password: '',
          confirmPassword: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          codigoPostal: '',
          dni: ''
        });
        setSelectedRol('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al Crear Usuario',
          text: data.message || data.error || 'No se pudo crear el usuario',
          confirmButtonText: 'Intentar de nuevo'
        });
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
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

  const handleCancel = () => {
    Swal.fire({
      title: '¿Cancelar creación?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData({
          nombre: '',
          email: '',
          password: '',
          confirmPassword: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          codigoPostal: '',
          dni: ''
        });
        setSelectedRol('');
        setFieldErrors({});
      }
    });
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop pt-6 pb-12 max-w-container-max mx-auto w-full fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue flex items-center gap-3">
            <Shield className="text-mass-yellow" size={32} />
            Crear Usuario Administrador
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Complete los datos para crear un nuevo usuario con permisos administrativos
          </p>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto w-full !p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-6 bg-surface">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre Completo *"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                error={fieldErrors.nombre ? fieldErrors.nombre[0] : null}
                disabled={loading}
                placeholder="Juan Pérez"
                required
              />
              
              <Input
                label="Correo Electrónico *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                error={fieldErrors.email ? fieldErrors.email[0] : null}
                disabled={loading}
                placeholder="admin@tiendamass.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Input
                  label="Contraseña *"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={fieldErrors.password ? fieldErrors.password[0] : null}
                  disabled={loading}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-on-surface-variant hover:text-trust-blue transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmar Contraseña *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={fieldErrors.confirmPassword ? fieldErrors.confirmPassword[0] : null}
                  disabled={loading}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-on-surface-variant hover:text-trust-blue transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Teléfono"
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                error={fieldErrors.telefono ? fieldErrors.telefono[0] : null}
                disabled={loading}
                placeholder="+51 987 654 321"
              />

              <div className="flex flex-col gap-1">
                <label className="font-label-bold text-label-bold text-on-surface">Rol *</label>
                <select
                  name="rol"
                  className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface min-h-[44px] ${
                    fieldErrors.rol ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
                  }`}
                  value={selectedRol}
                  onChange={(e) => setSelectedRol(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
                {fieldErrors.rol && <span className="font-label-md text-error mt-1">{fieldErrors.rol[0]}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="DNI *"
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                error={fieldErrors.dni ? fieldErrors.dni[0] : null}
                disabled={loading}
                placeholder="12345678"
                maxLength="8"
                required
              />

              <Input
                label="Dirección"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                error={fieldErrors.direccion ? fieldErrors.direccion[0] : null}
                disabled={loading}
                placeholder="Av. Principal 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Ciudad"
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                error={fieldErrors.ciudad ? fieldErrors.ciudad[0] : null}
                disabled={loading}
                placeholder="Lima"
              />

              <Input
                label="Código Postal"
                type="text"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleInputChange}
                error={fieldErrors.codigoPostal ? fieldErrors.codigoPostal[0] : null}
                disabled={loading}
                placeholder="15001"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              leadingIcon={<CloseIcon size={18} />}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              leadingIcon={<Save size={18} />}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CrearAdmin;