import React, { useState, useEffect } from 'react';
import { useUsuario } from '../../context/userContext';
import axios from 'axios';
import { Edit, Trash2, Plus, Search, Eye, X } from 'lucide-react';
import swal from 'sweetalert2';
import {
  validateNombre,
  validateEmail,
  validatePassword,
  validateDireccion,
  validateTelefono,
  validateCiudad,
  validateCodigoPostal,
  validateUserForm,
  normalizeEmail,
  normalizeName
} from '../../utils/usuariosvalidaciones';

import AdminTable, {
  StatusBadge,
  RowActions,
  RowAction,
} from './AdminTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const GestionUsuario = () => {
  const { getAuthHeaders } = useUsuario();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '',
    direccion: '',
    telefono: '',
    ciudad: '',
    codigoPostal: '',
    estadoId: 1,
    active: true,
    dni: '' 
  });
  const [errors, setErrors] = useState({});

  const API_URL = 'http://localhost:5001';

  const rolMapping = {
    'admin': 'Administrador',
    'cliente': 'Cliente'
  };

  const rolMappingReverse = {
    'Administrador': 'admin',
    'Cliente': 'cliente'
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/roles`);  
      setRoles(response.data);
    } catch (error) {
      console.error('Error al obtener roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/usuarios`);
      const formatted = response.data.map(user => ({
        ...user,
        rolNombre: rolMapping[user.rol?.nombre] || user.rol?.nombre || 'Cliente',
        lastLogin: new Date().toISOString(),
        active: true,
      }));
      setUsers(formatted);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch =
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === '' || user.rol?.id?.toString() === selectedRole || user.rolId?.toString() === selectedRole;
    return matchSearch && matchRole;
  });

  const handleEdit = user => {
    setEditingUser(user);
    const rolId = user.rol?.id?.toString() || user.rolId?.toString() || (roles.length > 0 ? roles[0].id.toString() : '');
    
    setFormData({
      nombre: user.nombre,
      email: user.email,
      rol: rolId,
      direccion: user.direccion || '',
      telefono: user.telefono || '',
      ciudad: user.ciudad || '',
      codigoPostal: user.codigoPostal || '',
      estadoId: user.estadoId || user.estado?.id || 1,
      active: user.active ?? true,
      dni: user.persona?.numeroDocumento || '' 
    });
    setErrors({});
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: roles.length > 0 ? roles[0].id.toString() : '', 
      direccion: '',
      telefono: '',
      ciudad: '',
      codigoPostal: '',
      estadoId: 1,
      active: true,
      dni: '' 
    });
    setErrors({});
    setShowModal(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    let fieldError = null;
    switch (field) {
      case 'nombre':
        fieldError = validateNombre(value);
        break;
      case 'email':
        fieldError = validateEmail(value);
        break;
      case 'password':
        fieldError = validatePassword(value, !editingUser);
        break;
      case 'direccion':
        fieldError = validateDireccion(value);
        break;
      case 'telefono':
        fieldError = validateTelefono(value);
        break;
      case 'ciudad':
        fieldError = validateCiudad(value);
        break;
      case 'codigoPostal':
        fieldError = validateCodigoPostal(value);
        break;
      case 'dni':
        if (!value || value.trim().length === 0) {
          fieldError = ['El DNI es requerido'];
        } else if (value.trim().length !== 8) {
          fieldError = ['El DNI debe tener exactamente 8 dígitos'];
        } else if (!/^\d+$/.test(value.trim())) {
          fieldError = ['El DNI debe contener solo números'];
        }
        break;
      default:
        break;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldError && fieldError.length > 0) {
        newErrors[field] = fieldError;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const formErrors = validateUserForm(formData, !!editingUser);
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setLoading(true);
      const dataToSend = {
        nombre: normalizeName(formData.nombre),
        email: normalizeEmail(formData.email),
        direccion: formData.direccion?.trim() || '',
        estadoId: formData.estadoId,
        telefono: formData.telefono?.trim() || '',
        ciudad: formData.ciudad?.trim() || '',
        codigoPostal: formData.codigoPostal?.trim() || '',
        rolId: parseInt(formData.rol),
        tipoClienteId: 1, 
        persona: { 
          nombres: normalizeName(formData.nombre),
          numeroDocumento: formData.dni 
        }
      };

      if (!editingUser || formData.password) {
        dataToSend.password = formData.password;
      }

      if (editingUser) {
        await axios.put(`${API_URL}/api/usuarios/update/${editingUser.id}`, dataToSend, {
          headers: getAuthHeaders()
        });
        swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Usuario actualizado exitosamente',
        });
      } else {
        await axios.post(`${API_URL}/api/usuarios/register`, dataToSend);
        swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Usuario creado exitosamente',
        });
      }

      setShowModal(false);
      setErrors({});
      fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al guardar usuario. Por favor, intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    const result = await swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de eliminar este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/api/usuarios/delete/${id}`, {
          headers: getAuthHeaders()
        });
        swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Usuario eliminado exitosamente',
        });
        fetchUsers();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Error al eliminar usuario.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleActive = id => {
    setUsers(users.map(u => (u.id === id ? { ...u, active: !u.active } : u)));
  };

  const getRoleColor = rol => {
    switch (rol) {
      case 'Administrador':
        return 'bg-sale-red';
      case 'Vendedor':
        return 'bg-mass-yellow';
      default:
        return 'bg-trust-blue';
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (u) => <span className="font-semibold text-on-surface">{u.nombre}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      render: (u) => <span className="text-on-surface-variant">{u.email}</span>,
    },
    {
      key: 'rolNombre',
      header: 'Rol',
      render: (u) => (
        <span className={`inline-flex items-center text-white font-label-bold text-label-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${getRoleColor(u.rolNombre)}`}>
          {u.rolNombre}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Último Acceso',
      render: (u) => <span className="text-on-surface-variant text-sm">{new Date(u.lastLogin).toLocaleDateString()}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (u) => (
        <button
          onClick={() => toggleActive(u.id)}
          disabled={loading}
          title="Click para cambiar estado"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StatusBadge
            active={u.active}
            activeLabel="Activo"
            inactiveLabel="Inactivo"
          />
        </button>
      ),
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (u) => (
        <RowActions>
          <RowAction icon={Edit} label="Editar" onClick={() => handleEdit(u)} disabled={loading} />
          <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => handleDelete(u.id)} disabled={loading} />
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div className="px-margin-mobile md:px-margin-desktop pt-6 max-w-container-max mx-auto w-full">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
          Gestión de Usuarios
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Administra usuarios y permisos del sistema
        </p>
      </div>

      <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full mt-6 mb-2">
        <select
          className="bg-surface border-2 border-transparent focus:border-trust-blue rounded-lg px-4 py-2 min-h-[44px] outline-none font-body-md text-body-md text-on-surface shadow-sm transition-all cursor-pointer w-full sm:w-64"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {roles.map(rol => (
            <option key={rol.id} value={rol.id.toString()}>
              {rol.nombre === 'admin' ? 'Administrador' : rol.nombre === 'cliente' ? 'Cliente' : rol.nombre}
            </option>
          ))}
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        empty={searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Buscar por nombre o correo...',
        }}
        primaryAction={{
          label: 'Agregar Usuario',
          onClick: handleAdd,
        }}
      />

      {showModal && (
        <UserFormModal
          editing={editingUser}
          formData={formData}
          errors={errors}
          loading={loading}
          roles={roles}
          onChange={handleFieldChange}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

function UserFormModal({
  editing,
  formData,
  errors,
  loading,
  roles,
  onChange,
  setFormData,
  onSubmit,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-tint/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col !p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface sticky top-0 z-10">
          <h3 className="font-headline-md text-headline-md text-trust-blue">
            {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-surface"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              type="text"
              value={formData.nombre}
              onChange={(e) => onChange('nombre', e.target.value)}
              error={errors.nombre ? errors.nombre[0] : null}
              disabled={loading}
              required
            />
            
            <Input
              label="Correo *"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              error={errors.email ? errors.email[0] : null}
              disabled={loading}
              required
            />

            <Input
              label={`Contraseña ${!editing ? '*' : ''}`}
              type="password"
              value={formData.password}
              onChange={(e) => onChange('password', e.target.value)}
              error={errors.password ? errors.password[0] : null}
              disabled={loading}
              required={!editing}
              placeholder={editing ? 'Dejar vacío para no cambiar' : ''}
            />

            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-label-bold text-on-surface">Rol *</label>
              <select
                className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface min-h-[44px] ${
                  errors.rol ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
                }`}
                value={formData.rol}
                onChange={e => setFormData({ ...formData, rol: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Seleccionar rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id.toString()}>
                    {rol.nombre === 'admin' ? 'Administrador' : rol.nombre === 'cliente' ? 'Cliente' : rol.nombre}
                  </option>
                ))}
              </select>
              {errors.rol && <span className="font-label-md text-error mt-1">{errors.rol[0]}</span>}
            </div>

            <Input
              label="DNI *"
              type="text"
              value={formData.dni}
              onChange={(e) => onChange('dni', e.target.value)}
              error={errors.dni ? errors.dni[0] : null}
              disabled={loading}
              placeholder="Ej: 12345678"
              maxLength="8"
              required
            />
            
            <Input
              label="Teléfono"
              type="text"
              value={formData.telefono}
              onChange={(e) => onChange('telefono', e.target.value)}
              error={errors.telefono ? errors.telefono[0] : null}
              disabled={loading}
              placeholder="Ej: +51 987 654 321"
              maxLength="20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Dirección"
              type="text"
              value={formData.direccion}
              onChange={(e) => onChange('direccion', e.target.value)}
              error={errors.direccion ? errors.direccion[0] : null}
              disabled={loading}
              placeholder="Ej: Av. Larco 1234, Miraflores"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                type="text"
                value={formData.ciudad}
                onChange={(e) => onChange('ciudad', e.target.value)}
                error={errors.ciudad ? errors.ciudad[0] : null}
                disabled={loading}
                placeholder="Ej: Lima"
              />
              <Input
                label="Código Postal"
                type="text"
                value={formData.codigoPostal}
                onChange={(e) => onChange('codigoPostal', e.target.value)}
                error={errors.codigoPostal ? errors.codigoPostal[0] : null}
                disabled={loading}
                placeholder="Ej: 15001"
                maxLength="10"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              disabled={loading}
              className="w-5 h-5 rounded border-2 border-outline-variant text-trust-blue focus:ring-trust-blue accent-trust-blue"
            />
            <span className="font-label-bold text-label-bold text-on-surface">
              Usuario activo (puede iniciar sesión)
            </span>
          </label>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando…' : editing ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default GestionUsuario;