import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { validateRegisterForm } from '../../utils/validators';
import Button from '../ui/Button';
import Input from '../ui/Input';

const API_URL = "http://localhost:5001";

function RegisterForm({ switchToLogin }) {
  const [tiposCliente, setTiposCliente] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    address: '',

    // ✅ dinámico desde BD
    tipoClienteId: '',

    // Persona (para NATURAL y también puedes usarlo como representante en JURIDICO)
    dni: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',

    // Empresa (solo JURIDICO)
    ruc: '',
    razonSocial: '',
    nombreComercial: ''
  });

  const [errors, setErrors] = useState({});

  // 1) Cargar tipos desde BD
  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tipos-cliente`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.message || 'No se pudo cargar tipos de cliente');

        setTiposCliente(Array.isArray(data) ? data : []);
        // Seleccionar por defecto el primero
        if (Array.isArray(data) && data.length > 0) {
          setFormData(prev => ({ ...prev, tipoClienteId: String(data[0].id) }));
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar TipoCliente desde el servidor'
        });
      } finally {
        setLoadingTipos(false);
      }
    };

    fetchTipos();
  }, []);

  const tipoSeleccionado = useMemo(() => {
    return tiposCliente.find(t => String(t.id) === String(formData.tipoClienteId));
  }, [tiposCliente, formData.tipoClienteId]);

  const esJuridico = (tipoSeleccionado?.nombre || '').toUpperCase() === 'JURIDICO';
  const esNatural = (tipoSeleccionado?.nombre || '').toUpperCase() === 'NATURAL';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const basicFrontChecks = () => {
    const validationErrors = validateRegisterForm(formData);
    const extra = { ...validationErrors };

    if (!formData.tipoClienteId) {
      extra.tipoClienteId = ['Selecciona el tipo de cliente'];
    }

    if (esNatural) {
      if (!formData.dni || formData.dni.length !== 8) {
        extra.dni = [...(extra.dni || []), 'DNI debe tener 8 dígitos'];
      }
      if (!formData.nombres) {
        extra.nombres = [...(extra.nombres || []), 'Nombres es obligatorio'];
      }
      if (!formData.apellidoPaterno) {
        extra.apellidoPaterno = [...(extra.apellidoPaterno || []), 'Apellido paterno es obligatorio'];
      }
    }

    if (esJuridico) {
      if (!formData.ruc || formData.ruc.length !== 11) {
        extra.ruc = [...(extra.ruc || []), 'RUC debe tener 11 dígitos'];
      }
      if (!formData.razonSocial) {
        extra.razonSocial = [...(extra.razonSocial || []), 'Razón social es obligatoria'];
      }
      if (!formData.nombres) {
        extra.nombres = [...(extra.nombres || []), 'Nombre del contacto es obligatorio'];
      }
    }

    return extra;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allErrors = basicFrontChecks();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        direccion: formData.address || "",
        tipoClienteId: Number(formData.tipoClienteId),
        rolId: 2, 
        persona: {
          tipoDocumento: "DNI",
          numeroDocumento: esNatural ? formData.dni : formData.dni || "", 
          nombres: formData.nombres,
          apellidoPaterno: formData.apellidoPaterno || "",
          apellidoMaterno: formData.apellidoMaterno || "",
          correo: formData.email.trim().toLowerCase(),
          telefono: formData.telefono || ""
        },
        empresa: esJuridico ? {
          ruc: formData.ruc,
          razonSocial: formData.razonSocial,
          nombreComercial: formData.nombreComercial || "",
          correo: formData.email.trim().toLowerCase(),
          telefono: formData.telefono || ""
        } : null
      };

      const response = await fetch(`${API_URL}/api/usuarios/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Ahora puedes iniciar sesión',
          confirmButtonText: 'OK'
        }).then(() => switchToLogin());
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Error al registrarse'
        });
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al conectar con el servidor'
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center">
        <h2 className="font-headline-lg text-headline-lg text-trust-blue">Crear Cuenta</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Completa tus datos para registrarte
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          id="register-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="ejemplo@correo.com"
          error={errors.email ? errors.email[0] : null}
          leadingIcon={<span className="material-symbols-outlined">mail</span>}
        />

        <div className="flex flex-col gap-xs w-full">
          <label className="font-label-bold text-label-bold text-on-surface">Tipo de cliente</label>
          <div className="relative">
            <select
              name="tipoClienteId"
              value={formData.tipoClienteId}
              onChange={handleInputChange}
              disabled={loadingTipos}
              className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm pl-md pr-xl font-body-md text-body-md text-on-surface appearance-none ${
                errors.tipoClienteId ? 'border-error focus:border-error' : 'border-transparent focus:border-trust-blue'
              } ${loadingTipos ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tiposCliente.length === 0 && (
                <option value="">Sin tipos disponibles</option>
              )}
              {tiposCliente.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.nombre}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-sm flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
          {errors.tipoClienteId && (
            <span className="font-label-md text-label-md text-error">
              {errors.tipoClienteId[0]}
            </span>
          )}
        </div>

        {/* Campos NATURAL */}
        {esNatural && (
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="DNI"
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              placeholder="8 dígitos"
              error={errors.dni ? errors.dni[0] : null}
              leadingIcon={<span className="material-symbols-outlined">badge</span>}
            />
            <Input
              label="Nombres"
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              error={errors.nombres ? errors.nombres[0] : null}
              leadingIcon={<span className="material-symbols-outlined">person</span>}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Apellido paterno"
                type="text"
                name="apellidoPaterno"
                value={formData.apellidoPaterno}
                onChange={handleInputChange}
                error={errors.apellidoPaterno ? errors.apellidoPaterno[0] : null}
              />
              <Input
                label="Apellido materno"
                type="text"
                name="apellidoMaterno"
                value={formData.apellidoMaterno}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        {/* Campos JURIDICO */}
        {esJuridico && (
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="RUC"
              type="text"
              name="ruc"
              value={formData.ruc}
              onChange={handleInputChange}
              placeholder="11 dígitos"
              error={errors.ruc ? errors.ruc[0] : null}
              leadingIcon={<span className="material-symbols-outlined">corporate_fare</span>}
            />
            <Input
              label="Razón social"
              type="text"
              name="razonSocial"
              value={formData.razonSocial}
              onChange={handleInputChange}
              error={errors.razonSocial ? errors.razonSocial[0] : null}
            />
            <Input
              label="Nombre comercial (opcional)"
              type="text"
              name="nombreComercial"
              value={formData.nombreComercial}
              onChange={handleInputChange}
            />
            <Input
              label="Nombre del contacto"
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              error={errors.nombres ? errors.nombres[0] : null}
              leadingIcon={<span className="material-symbols-outlined">person</span>}
            />
          </div>
        )}

        <Input
          label="Teléfono (opcional)"
          type="text"
          name="telefono"
          value={formData.telefono}
          onChange={handleInputChange}
          leadingIcon={<span className="material-symbols-outlined">call</span>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contraseña"
            id="register-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="********"
            error={errors.password ? errors.password[0] : null}
            leadingIcon={<span className="material-symbols-outlined">lock</span>}
          />
          <Input
            label="Confirmar contraseña"
            id="register-confirmPassword"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="********"
            error={errors.confirmPassword ? errors.confirmPassword[0] : null}
            leadingIcon={<span className="material-symbols-outlined">lock</span>}
          />
        </div>

        <Button type="submit" variant="primary" className="w-full mt-4">
          Registrarse
        </Button>

        <div className="text-center mt-6">
          <p className="font-body-md text-body-md text-on-surface-variant">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={switchToLogin}
              className="font-label-bold text-label-bold text-trust-blue hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;