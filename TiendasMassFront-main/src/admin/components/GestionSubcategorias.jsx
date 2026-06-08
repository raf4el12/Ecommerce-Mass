import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import axios from 'axios';
import swal from 'sweetalert2';
import AdminTable, {
  StatusBadge,
  RowActions,
  RowAction,
} from './AdminTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const URL = 'http://localhost:5001';

const VALIDATION_RULES = {
  NOMBRE_MIN_LENGTH: 3,
  NOMBRE_MAX_LENGTH: 50,
  DESCRIPCION_MAX_LENGTH: 200,
  NOMBRE_REGEX: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/,
};

const SubcategoryManager = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoriaId: '',
    estado: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const API_URL = `${URL}/api/subcategorias`;
  const CATEGORIES_URL = `${URL}/api/categorias`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subcatRes, catRes] = await Promise.all([
          axios.get(API_URL),
          axios.get(CATEGORIES_URL)
        ]);
        setSubcategories(subcatRes.data);
        setCategories(catRes.data);
      } catch (error) {
        swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los datos.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSubcategories = Array.isArray(subcategories)
    ? subcategories.filter(subcategory =>
      (subcategory.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subcategory.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subcategory.categoria?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre || formData.nombre.trim() === '') {
      errors.nombre = 'El nombre de la subcategoría es obligatorio';
      setFieldErrors(errors);
      return false;
    }

    if (!formData.categoriaId) {
      errors.categoriaId = 'Debes seleccionar una categoría';
      setFieldErrors(errors);
      return false;
    }

    const nombre = formData.nombre.trim();
    const descripcion = formData.descripcion.trim();

    if (nombre.length < VALIDATION_RULES.NOMBRE_MIN_LENGTH) {
      errors.nombre = `El nombre debe tener al menos ${VALIDATION_RULES.NOMBRE_MIN_LENGTH} caracteres`;
    }

    if (nombre.length > VALIDATION_RULES.NOMBRE_MAX_LENGTH) {
      errors.nombre = `El nombre no puede exceder ${VALIDATION_RULES.NOMBRE_MAX_LENGTH} caracteres`;
    }

    if (nombre && !VALIDATION_RULES.NOMBRE_REGEX.test(nombre)) {
      errors.nombre = 'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos';
    }

    if (descripcion.length > VALIDATION_RULES.DESCRIPCION_MAX_LENGTH) {
      errors.descripcion = `La descripción no puede exceder ${VALIDATION_RULES.DESCRIPCION_MAX_LENGTH} caracteres`;
    }

    const nombreExistente = subcategories.find(subcat => 
      subcat.nombre.toLowerCase() === nombre.toLowerCase() && 
      subcat.categoriaId === parseInt(formData.categoriaId) &&
      subcat.id !== editingSubcategory?.id
    );

    if (nombreExistente) {
      errors.nombre = 'Ya existe una subcategoría con este nombre en esta categoría';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEdit = (subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      nombre: subcategory.nombre,
      descripcion: subcategory.descripcion,
      categoriaId: subcategory.categoria?.id?.toString() || '',
      estado: subcategory.estado?.nombre === 'Activo'
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingSubcategory(null);
    setFormData({ nombre: '', descripcion: '', categoriaId: '', estado: true });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const nombreLimpio = formData.nombre.trim();
    const descripcionLimpia = formData.descripcion.trim();

    try {
      setLoading(true);
      const dataToSend = {
        nombre: nombreLimpio,
        descripcion: descripcionLimpia,
        categoriaId: parseInt(formData.categoriaId)
      };
      
      if (typeof formData.estado === 'number' && !isNaN(formData.estado)) {
        dataToSend.estado = formData.estado;
      }
      
      if (editingSubcategory) {
        const response = await axios.put(`${API_URL}/${editingSubcategory.id}`, dataToSend);
        setSubcategories(subcategories.map(s => s.id === editingSubcategory.id ? response.data : s));
        swal.fire({
          icon: 'success',
          title: 'Actualizada',
          text: 'Subcategoría actualizada exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const res = await axios.post(API_URL, dataToSend);
        setSubcategories([res.data, ...subcategories]);
        swal.fire({
          icon: 'success',
          title: 'Creada',
          text: 'Subcategoría creada exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
      setShowModal(false);
    } catch (error) {
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo guardar la subcategoría.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await swal.fire({
      title: '¿Está seguro de eliminar esta subcategoría?',
      text: "Esta acción no se puede deshacer.",
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
        await axios.delete(`${API_URL}/${id}`);
        setSubcategories(subcategories.filter(s => s.id !== id));
        swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'La subcategoría ha sido eliminada.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la subcategoría.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleActive = async (subcategory) => {
    if (subcategory.estado?.nombre === 'Activo' && subcategory.productos?.length > 0) {
      const result = await swal.fire({
        title: '¡Atención!',
        text: `Esta subcategoría tiene ${subcategory.productos.length} producto(s) asociado(s). ¿Desea desactivarla de todas formas?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
      });
      if (!result.isConfirmed) return;
    }

    try {
      setLoading(true);
      const newEstadoId = subcategory.estado?.id === 1 ? 2 : 1;
      const response = await axios.put(`${API_URL}/${subcategory.id}`, { estado: newEstadoId }, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSubcategories(subcategories.map(s => s.id === subcategory.id ? response.data : s));
      swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `La subcategoría ha sido ${newEstadoId === 1 ? 'activada' : 'desactivada'}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo cambiar el estado de la subcategoría.',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (s) => <span className="font-semibold text-on-surface">{s.nombre}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (s) => (
        <span className="text-on-surface-variant line-clamp-2 max-w-md block">
          {s.descripcion || '—'}
        </span>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (s) => (
        <span className="inline-flex items-center bg-trust-blue text-on-primary font-label-bold text-label-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
          {s.categoria?.nombre || 'N/A'}
        </span>
      ),
    },
    {
      key: 'productos',
      header: 'Productos',
      render: (s) => (
        <span className="inline-flex items-center bg-secondary-container/60 text-on-secondary-container font-label-bold text-label-bold px-3 py-1 rounded-full">
          {s.productos?.length || 0}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (s) => (
        <button
          onClick={() => toggleActive(s)}
          disabled={loading}
          title="Click para cambiar estado"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StatusBadge
            active={s.estado?.nombre === 'Activo'}
            activeLabel="Activa"
            inactiveLabel="Inactiva"
          />
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
      <div className="px-margin-mobile md:px-margin-desktop pt-6 max-w-container-max mx-auto w-full">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
          Gestión de Subcategorías
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Organiza y administra las subcategorías de productos
        </p>
      </div>

      <AdminTable
        columns={columns}
        data={filteredSubcategories}
        loading={loading && subcategories.length === 0}
        empty={searchTerm ? 'No se encontraron subcategorías' : 'No hay subcategorías registradas'}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Buscar por nombre, descripción o categoría...',
        }}
        primaryAction={{
          label: 'Agregar Subcategoría',
          onClick: handleAdd,
        }}
      />

      {showModal && (
        <SubcategoryFormModal
          editing={editingSubcategory}
          formData={formData}
          fieldErrors={fieldErrors}
          loading={loading}
          categories={categories}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

function SubcategoryFormModal({
  editing,
  formData,
  fieldErrors,
  loading,
  categories,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-tint/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col !p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface sticky top-0 z-10">
          <h3 className="font-headline-md text-headline-md text-trust-blue">
            {editing ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
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
          <div className="flex flex-col gap-1">
            <label className="font-label-bold text-label-bold text-on-surface">Categoría *</label>
            <select
              name="categoriaId"
              className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface ${
                fieldErrors.categoriaId ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
              }`}
              value={formData.categoriaId}
              onChange={onChange}
              required
              disabled={loading}
            >
              <option value="">-- Seleccionar categoría --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {fieldErrors.categoriaId && <span className="font-label-md text-error mt-1">{fieldErrors.categoriaId}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline mb-1">
              <label className="font-label-bold text-label-bold text-on-surface">Nombre *</label>
              <span className="text-xs text-on-surface-variant">
                {formData.nombre.length}/{VALIDATION_RULES.NOMBRE_MAX_LENGTH}
              </span>
            </div>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={onChange}
              placeholder="Ej: Smartphones, Laptops, etc."
              maxLength={VALIDATION_RULES.NOMBRE_MAX_LENGTH}
              required
              disabled={loading}
              error={fieldErrors.nombre}
            />
            {!fieldErrors.nombre && (
              <p className="text-xs text-on-surface-variant mt-1">
                Mínimo {VALIDATION_RULES.NOMBRE_MIN_LENGTH} caracteres. Solo letras, números, espacios y guiones.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline mb-1">
              <label className="font-label-bold text-label-bold text-on-surface">Descripción</label>
              <span className="text-xs text-on-surface-variant">
                {formData.descripcion.length}/{VALIDATION_RULES.DESCRIPCION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              name="descripcion"
              rows={3}
              value={formData.descripcion}
              onChange={onChange}
              placeholder="Describe brevemente esta subcategoría"
              maxLength={VALIDATION_RULES.DESCRIPCION_MAX_LENGTH}
              disabled={loading}
              className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface min-h-[100px] resize-none ${
                fieldErrors.descripcion ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
              }`}
            />
            {fieldErrors.descripcion && <span className="font-label-md text-error mt-1">{fieldErrors.descripcion}</span>}
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
            <input
              type="checkbox"
              name="estado"
              checked={formData.estado}
              onChange={onChange}
              disabled={loading}
              className="w-5 h-5 rounded border-2 border-outline-variant text-trust-blue focus:ring-trust-blue accent-trust-blue"
            />
            <span className="font-label-bold text-label-bold text-on-surface">
              Subcategoría activa
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
            disabled={loading || !formData.nombre.trim() || !formData.categoriaId}
          >
            {loading
              ? editing
                ? 'Actualizando…'
                : 'Guardando…'
              : editing
              ? 'Actualizar'
              : 'Guardar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default SubcategoryManager;
