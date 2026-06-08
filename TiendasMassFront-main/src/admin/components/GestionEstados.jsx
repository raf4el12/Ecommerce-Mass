import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, ArrowUp, ArrowDown, X as CloseIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import AdminTable, { StatusBadge, RowActions, RowAction } from './AdminTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const API_URL = "http://localhost:5001";

const StatusManager = () => {
  const [statuses, setStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#6c757d',
    activo: true,
    orden: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/estados`);
      if (!response.ok) throw new Error('Error al cargar estados');
      const data = await response.json();
      setStatuses(data);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los estados' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const filteredStatuses = statuses
    .filter(status =>
      status.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (status.descripcion && status.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.orden - b.orden);

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre || formData.nombre.trim() === '') {
      errors.nombre = ['El nombre del estado es obligatorio'];
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = ['El nombre debe tener al menos 2 caracteres'];
    } else if (formData.nombre.trim().length > 50) {
      errors.nombre = ['El nombre no puede exceder 50 caracteres'];
    }
    if (formData.descripcion && formData.descripcion.length > 200) {
      errors.descripcion = ['La descripción no puede exceder 200 caracteres'];
    }
    const nombreExistente = statuses.find(s => 
      s.nombre.toLowerCase() === formData.nombre.trim().toLowerCase() && 
      s.id !== editingStatus?.id
    );
    if (nombreExistente) {
      errors.nombre = ['Ya existe un estado con este nombre'];
    }
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

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      nombre: status.nombre,
      descripcion: status.descripcion || '',
      color: status.color,
      activo: status.activo,
      orden: status.orden
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingStatus(null);
    setFormData({
      nombre: '',
      descripcion: '',
      color: '#6c757d',
      activo: true,
      orden: statuses.length + 1
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const url = editingStatus ? `${API_URL}/api/estados/${editingStatus.id}` : `${API_URL}/api/estados`;
      const method = editingStatus ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la operación');
      }

      const result = await response.json();
      
      if (editingStatus) {
        setStatuses(statuses.map(s => s.id === editingStatus.id ? result : s));
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Estado actualizado correctamente' });
      } else {
        setStatuses([...statuses, result]);
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Estado creado correctamente' });
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error en la operación' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer",
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
        const response = await fetch(`${API_URL}/api/estados/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar');
        }
        setStatuses(statuses.filter(s => s.id !== id));
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Estado eliminado correctamente' });
      } catch (error) {
        console.error('Error:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error al eliminar estado' });
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleActive = async (id) => {
    try {
      const status = statuses.find(s => s.id === id);
      if (!status) return;
      const response = await fetch(`${API_URL}/api/estados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...status, activo: !status.activo }),
      });
      if (!response.ok) throw new Error('Error al actualizar estado');
      const updatedStatus = await response.json();
      setStatuses(statuses.map(s => s.id === id ? updatedStatus : s));
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cambiar el estado' });
    }
  };

  const moveStatus = async (id, direction) => {
    try {
      const currentStatus = statuses.find(s => s.id === id);
      if (!currentStatus) return;
      const newOrder = direction === 'up' ? currentStatus.orden - 1 : currentStatus.orden + 1;
      const swapStatus = statuses.find(s => s.orden === newOrder);

      if (swapStatus) {
        const response = await fetch(`${API_URL}/api/estados/orden/actualizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estados: [
              { id: id, orden: newOrder },
              { id: swapStatus.id, orden: currentStatus.orden }
            ]
          }),
        });
        if (!response.ok) throw new Error('Error al actualizar el orden');
        const updatedStatuses = await response.json();
        setStatuses(updatedStatuses);
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cambiar el orden' });
    }
  };

  const columns = [
    {
      key: 'orden',
      header: 'Orden',
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => moveStatus(s.id, 'up')}
              disabled={s.orden === 1 || loading}
              className="text-on-surface-variant hover:text-trust-blue disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => moveStatus(s.id, 'down')}
              disabled={s.orden === statuses.length || loading}
              className="text-on-surface-variant hover:text-trust-blue disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDown size={14} />
            </button>
          </div>
          <span className="font-headline-sm text-trust-blue w-6 text-center">{s.orden}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (s) => (
        <span
          className="inline-flex items-center px-3 py-1 rounded-full font-label-bold text-label-bold text-white uppercase tracking-wider"
          style={{ backgroundColor: s.color }}
        >
          {s.nombre}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (s) => <span className="text-on-surface-variant">{s.descripcion || 'Sin descripción'}</span>,
    },
    {
      key: 'color',
      header: 'Color',
      render: (s) => (
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded shadow-sm border border-outline-variant/30"
            style={{ backgroundColor: s.color }}
          ></div>
          <span className="text-on-surface-variant font-mono text-sm">{s.color}</span>
        </div>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (s) => (
        <button
          onClick={() => toggleActive(s.id)}
          disabled={loading}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StatusBadge active={s.activo} />
        </button>
      ),
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (s) => (
        <RowActions>
          <RowAction icon={Edit} label="Editar" onClick={() => handleEdit(s)} disabled={loading} />
          <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => handleDelete(s.id)} disabled={loading} />
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div className="px-margin-mobile md:px-margin-desktop pt-6 max-w-container-max mx-auto w-full fade-in space-y-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
            Gestión de Estados
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Configura los estados de los pedidos y su flujo
          </p>
        </div>

        <AdminTable
          columns={columns}
          data={filteredStatuses}
          loading={loading && statuses.length === 0}
          empty={searchTerm ? 'No se encontraron estados' : 'No hay estados registrados'}
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Buscar estados...',
          }}
          primaryAction={{
            label: 'Agregar Estado',
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
                  {editingStatus ? 'Editar Estado' : 'Nuevo Estado'}
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
                    label="Nombre del Estado *"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    error={fieldErrors.nombre ? fieldErrors.nombre[0] : null}
                    disabled={loading}
                    required
                  />

                  <div className="flex flex-col gap-1">
                    <label className="font-label-bold text-label-bold text-on-surface">Descripción</label>
                    <textarea
                      name="descripcion"
                      rows={3}
                      className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface resize-none ${
                        fieldErrors.descripcion ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
                      }`}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.descripcion && <span className="font-label-md text-error mt-1">{fieldErrors.descripcion[0]}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-bold text-label-bold text-on-surface">Color *</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-12 h-12 p-1 bg-surface border-2 border-outline-variant rounded-lg cursor-pointer"
                          disabled={loading}
                        />
                        <span className="font-mono text-sm text-on-surface-variant">{formData.color}</span>
                      </div>
                    </div>

                    <Input
                      label="Orden *"
                      type="number"
                      name="orden"
                      min="1"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      disabled={loading}
                      className="w-5 h-5 rounded border-2 border-outline-variant text-trust-blue focus:ring-trust-blue accent-trust-blue"
                    />
                    <span className="font-label-bold text-label-bold text-on-surface">
                      Estado activo
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Guardando...' : editingStatus ? 'Actualizar' : 'Guardar'}
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

export default StatusManager;
