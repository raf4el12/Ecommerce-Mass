import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, X as CloseIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import AdminTable, { StatusBadge, RowActions, RowAction } from './AdminTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const API_URL = "http://localhost:5001";

const GestionTienda = () => {
  const [tiendas, setTiendas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTienda, setEditingTienda] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    activo: true
  });

  const loadTiendas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tiendas`);
      if (!res.ok) throw new Error('Error al cargar tiendas');
      const data = await res.json();
      setTiendas(data);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron cargar las tiendas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiendas();
  }, []);

  const filteredTiendas = tiendas.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.direccion && t.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validateForm = () => {
    const errors = {};
    const nombre = (formData.nombre || '').trim();
    const direccion = (formData.direccion || '').trim();

    if (!nombre) errors.nombre = ['El nombre es obligatorio'];
    if (!direccion) errors.direccion = ['La dirección es obligatoria'];

    const duplicado = tiendas.find(t =>
      (t.nombre || '').trim().toLowerCase() === nombre.toLowerCase() &&
      t.id !== editingTienda?.id
    );
    if (duplicado) errors.nombre = ['Ya existe una tienda con este nombre'];

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAdd = () => {
    setEditingTienda(null);
    setFormData({ nombre: '', direccion: '', telefono: '', activo: true });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleEdit = (tienda) => {
    setEditingTienda(tienda);
    setFormData({
      nombre: tienda.nombre,
      direccion: tienda.direccion || '',
      telefono: tienda.telefono || '',
      activo: tienda.activo
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const url = editingTienda ? `${API_URL}/api/tiendas/${editingTienda.id}` : `${API_URL}/api/tiendas`;
      const method = editingTienda ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        let msg = 'Error en la operación';
        try {
            const err = await res.json();
            msg = err.error || err.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();

      if (editingTienda) {
        setTiendas(tiendas.map(t => t.id === data.id ? data : t));
        Swal.fire('Éxito', 'Tienda actualizada correctamente', 'success');
      } else {
        setTiendas([...tiendas, data]);
        Swal.fire('Éxito', 'Tienda creada correctamente', 'success');
      }
      setShowModal(false);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar tienda?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tiendas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');

      setTiendas(tiendas.filter(t => t.id !== id));
      Swal.fire('Eliminado', 'Tienda eliminada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      const tienda = tiendas.find(t => t.id === id);
      if (!tienda) return;
      const res = await fetch(`${API_URL}/api/tiendas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tienda, activo: !tienda.activo })
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      const data = await res.json();
      setTiendas(tiendas.map(t => t.id === id ? data : t));
    } catch (error) {
      Swal.fire('Error', 'Error al cambiar el estado', 'error');
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (t) => <span className="font-semibold text-on-surface">{t.nombre}</span>,
    },
    {
      key: 'direccion',
      header: 'Dirección',
      render: (t) => <span className="text-on-surface-variant">{t.direccion || '—'}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (t) => <span className="text-on-surface-variant">{t.telefono || '—'}</span>,
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (t) => (
        <button
          onClick={() => toggleActive(t.id)}
          disabled={loading}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StatusBadge active={t.activo} />
        </button>
      ),
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (t) => (
        <RowActions>
          <RowAction icon={Edit} label="Editar" onClick={() => handleEdit(t)} disabled={loading} />
          <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => handleDelete(t.id)} disabled={loading} />
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div className="px-margin-mobile md:px-margin-desktop pt-6 max-w-container-max mx-auto w-full fade-in space-y-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
            Gestión de Tiendas
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Administra las tiendas del sistema
          </p>
        </div>

        <AdminTable
          columns={columns}
          data={filteredTiendas}
          loading={loading && tiendas.length === 0}
          empty={searchTerm ? 'No se encontraron tiendas' : 'No hay tiendas registradas'}
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Buscar tienda...',
          }}
          primaryAction={{
            label: 'Agregar Tienda',
            icon: Plus,
            onClick: handleAdd,
          }}
        />

        {showModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-tint/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <Card
              className="w-full max-w-lg overflow-hidden flex flex-col !p-0 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface sticky top-0 z-10">
                <h3 className="font-headline-md text-headline-md text-trust-blue">
                  {editingTienda ? 'Editar Tienda' : 'Nueva Tienda'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="p-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="p-6 space-y-6 bg-surface">
                  <Input
                    label="Nombre *"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    error={fieldErrors.nombre ? fieldErrors.nombre[0] : null}
                    disabled={loading}
                    required
                  />

                  <Input
                    label="Dirección *"
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    error={fieldErrors.direccion ? fieldErrors.direccion[0] : null}
                    disabled={loading}
                    required
                  />

                  <Input
                    label="Teléfono"
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    disabled={loading}
                  />

                  <label className="flex items-center gap-3 cursor-pointer select-none bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-5 h-5 rounded border-2 border-outline-variant text-trust-blue focus:ring-trust-blue accent-trust-blue"
                    />
                    <span className="font-label-bold text-label-bold text-on-surface">
                      Tienda activa
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Guardando...' : editingTienda ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default GestionTienda;
