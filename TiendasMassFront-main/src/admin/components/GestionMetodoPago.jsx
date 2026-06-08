import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, X as CloseIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { validateForm, validateField, checkDuplicateName } from '../../utils/metodospagovalidaciones';
import AdminTable, { RowActions, RowAction } from './AdminTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const API_URL = "http://localhost:5001";

const PaymentMethodManager = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    comision: 0
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/metodos-pago`);
      if (!response.ok) throw new Error('Error al cargar métodos de pago');
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los métodos de pago' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const filteredMethods = paymentMethods.filter(method =>
    method.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (method.descripcion && method.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      nombre: method.nombre,
      descripcion: method.descripcion || '',
      comision: method.comision || 0
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingMethod(null);
    setFormData({
      nombre: '',
      descripcion: '',
      comision: 0
    });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error ? [error] : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm(formData);
    const nombreDuplicado = checkDuplicateName(formData.nombre, paymentMethods, editingMethod?.id);
    if (nombreDuplicado) errors.nombre = 'Ya existe un método de pago con este nombre';

    const formattedErrors = {};
    for (const key in errors) {
      formattedErrors[key] = [errors[key]];
    }

    if (Object.keys(formattedErrors).length > 0) {
      setFieldErrors(formattedErrors);
      return;
    }

    try {
      setLoading(true);
      const url = editingMethod ? `${API_URL}/api/metodos-pago/${editingMethod.id}` : `${API_URL}/api/metodos-pago`;
      const method = editingMethod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, comision: parseFloat(formData.comision) || 0 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la operación');
      }

      const result = await response.json();
      
      if (editingMethod) {
        setPaymentMethods(paymentMethods.map(m => m.id === editingMethod.id ? result : m));
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Método de pago actualizado correctamente' });
      } else {
        setPaymentMethods([result, ...paymentMethods]);
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Método de pago creado correctamente' });
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
        const response = await fetch(`${API_URL}/api/metodos-pago/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar');
        }
        setPaymentMethods(paymentMethods.filter(m => m.id !== id));
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Método de pago eliminado correctamente' });
      } catch (error) {
        console.error('Error:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error al eliminar método de pago' });
      } finally {
        setLoading(false);
      }
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'Método',
      render: (m) => <span className="font-semibold text-on-surface">{m.nombre}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (m) => <span className="text-on-surface-variant">{m.descripcion || 'Sin descripción'}</span>,
    },
    {
      key: 'comision',
      header: 'Comisión',
      render: (m) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-bold text-label-bold ${
          m.comision === 0 ? 'text-success bg-success/10' : 'text-mass-yellow bg-mass-yellow/10'
        }`}>
          {m.comision || 0}%
        </span>
      ),
    },
    {
      key: 'creadoEn',
      header: 'Fecha Creación',
      render: (m) => <span className="text-on-surface-variant text-sm">{new Date(m.creadoEn).toLocaleDateString()}</span>,
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (m) => (
        <RowActions>
          <RowAction icon={Edit} label="Editar" onClick={() => handleEdit(m)} disabled={loading} />
          <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => handleDelete(m.id)} disabled={loading} />
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div className="px-margin-mobile md:px-margin-desktop pt-6 max-w-container-max mx-auto w-full fade-in space-y-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
            Métodos de Pago
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Gestiona los métodos de pago disponibles en el sistema
          </p>
        </div>

        <AdminTable
          columns={columns}
          data={filteredMethods}
          loading={loading && paymentMethods.length === 0}
          empty={searchTerm ? 'No se encontraron métodos de pago' : 'No hay métodos registrados'}
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Buscar métodos de pago...',
          }}
          primaryAction={{
            label: 'Agregar Método',
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
                  {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
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
                  <div>
                    <Input
                      label="Nombre del Método *"
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      error={fieldErrors.nombre ? fieldErrors.nombre[0] : null}
                      disabled={loading}
                      placeholder="Ej: Tarjeta Visa, Yape, Pago Efectivo"
                      required
                    />
                    <p className="text-sm text-on-surface-variant mt-1 ml-1">Entre 3 y 100 caracteres</p>
                  </div>

                  <div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-bold text-label-bold text-on-surface">Descripción</label>
                      <textarea
                        name="descripcion"
                        rows={3}
                        className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface resize-none ${
                          fieldErrors.descripcion ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
                        }`}
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="Describe cómo funciona este método de pago..."
                      />
                      {fieldErrors.descripcion && <span className="font-label-md text-error mt-1">{fieldErrors.descripcion[0]}</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1 ml-1">Opcional. Máximo 500 caracteres</p>
                  </div>

                  <div>
                    <Input
                      label="Comisión (%) *"
                      type="number"
                      name="comision"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.comision}
                      onChange={handleInputChange}
                      error={fieldErrors.comision ? fieldErrors.comision[0] : null}
                      disabled={loading}
                      placeholder="0.00"
                      required
                    />
                    <p className="text-sm text-on-surface-variant mt-1 ml-1">Porcentaje entre 0 y 100</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Guardando...' : editingMethod ? 'Actualizar' : 'Guardar'}
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

export default PaymentMethodManager;