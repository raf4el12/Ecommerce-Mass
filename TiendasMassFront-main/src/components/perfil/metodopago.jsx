import React, { useEffect, useState } from 'react';
import { Edit3, Trash2, Plus, CreditCard, Shield } from 'lucide-react';
import './styleperfil.css';
import Swal from 'sweetalert2';
import { useUsuario } from '../../context/userContext';
import { validateTarjetaForm, validateField } from '../../utils/tarjetasvalidaciones';
const API_URL = "http://localhost:5001";

const initialForm = {
  id: null,
  tipoTarjeta: '',
  numeroTarjeta: '',
  fechaVencimiento: '',
  nombreEnTarjeta: '',
};

const Payments = () => {
  const { usuario, getAuthHeaders } = useUsuario();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Cargar tarjetas del usuario
  const fetchPaymentMethods = async () => {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tarjetas-usuario/usuario/${usuario.id}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setPaymentMethods(data);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las tarjetas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
    // eslint-disable-next-line
  }, [usuario?.id]);

  // Abrir modal para nueva tarjeta
  const handleAdd = () => {
    setForm(initialForm);
    setIsEditing(false);
    setFieldErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar tarjeta
  const handleEdit = (payment) => {
    setForm({ 
      ...payment,
      numeroTarjeta: '' // No mostrar el número completo por seguridad
    });
    setIsEditing(true);
    setFieldErrors({});
    setShowModal(true);
  };

  // Eliminar tarjeta
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar tarjeta?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tarjetas-usuario/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      Swal.fire('Eliminado', 'Tarjeta eliminada', 'success');
      fetchPaymentMethods();
    } catch {
      Swal.fire('Error', 'No se pudo eliminar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Formatear número de tarjeta mientras se escribe
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatear fecha de vencimiento
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Manejar cambios con validación en tiempo real
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Validación en tiempo real
    const error = validateField(field, value, form);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Guardar tarjeta (crear o editar)
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validar formulario completo
    const errors = validateTarjetaForm(form);
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        usuarioId: usuario.id,
        numeroTarjeta: numeroLimpio,
      };

      let res;
      if (isEditing) {
        res = await fetch(`${API_URL}/api/tarjetas-usuario/${form.id}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/tarjetas-usuario`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }
      
      setShowModal(false);
      Swal.fire('Éxito', `Tarjeta ${isEditing ? 'actualizada' : 'agregada'} correctamente`, 'success');
      fetchPaymentMethods();
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo guardar la tarjeta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Obtener icono de tarjeta según el tipo
  const getCardIcon = (tipo) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('visa')) return 'visa';
    if (tipoLower.includes('mastercard') || tipoLower.includes('master')) return 'mastercard';
    if (tipoLower.includes('amex') || tipoLower.includes('american')) return 'amex';
    return 'generic';
  };

  return (
    <div className="payments-section">
      <div className="section-header">
        <div className="header-content">
          <h2>Métodos de Pago</h2>
          <p>Gestiona tus tarjetas y métodos de pago</p>
        </div>
        <button className="add-btn" onClick={handleAdd} disabled={loading}>
          <Plus size={16} /> Agregar Tarjeta
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      <div className="payments-grid">
        {paymentMethods.length === 0 && !loading && (
          <p>No tienes tarjetas registradas.</p>
        )}
        {paymentMethods.map((payment) => (
          <div key={payment.id} className="payment-card">
            <div className="payment-header">
              <div className="payment-brand">
                <div className={`card-icon ${getCardIcon(payment.tipoTarjeta)}`}>
                  <CreditCard size={20} />
                </div>
                <div className="payment-info">
                  <span className="payment-type">{payment.tipoTarjeta}</span>
                  <span className="payment-number">{payment.numeroEnmascarado}</span>
                </div>
              </div>
            </div>
            <div className="payment-details">
              <div className="payment-expiry">Expira {payment.fechaVencimiento}</div>
              <div className="payment-name">{payment.nombreEnTarjeta}</div>
            </div>
            <div className="payment-actions">
              <button className="action-btn edit-action" title="Editar" onClick={() => handleEdit(payment)}>
                <Edit3 size={14} />
              </button>
              <button className="action-btn delete-action" title="Eliminar" onClick={() => handleDelete(payment.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para agregar/editar tarjeta */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</h3>
            <form onSubmit={handleSave} className="payment-form">
              <label>
                Tipo de Tarjeta*
                <select 
                  value={form.tipoTarjeta} 
                  onChange={e => handleInputChange('tipoTarjeta', e.target.value)}
                  required
                  className={fieldErrors.tipoTarjeta ? 'input-error' : ''}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                  <option value="Discover">Discover</option>
                  <option value="Otro">Otro</option>
                </select>
                {fieldErrors.tipoTarjeta && (
                  <span className="error-text">{fieldErrors.tipoTarjeta}</span>
                )}
              </label>
              
              <label>
                Número de Tarjeta*
                <input 
                  type="text" 
                  value={form.numeroTarjeta} 
                  onChange={e => handleInputChange('numeroTarjeta', formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                  className={fieldErrors.numeroTarjeta ? 'input-error' : ''}
                />
                {fieldErrors.numeroTarjeta && (
                  <span className="error-text">{fieldErrors.numeroTarjeta}</span>
                )}
              </label>
              
              <div className="form-row">
                <label>
                  Fecha de Vencimiento*
                  <input 
                    type="text" 
                    value={form.fechaVencimiento} 
                    onChange={e => handleInputChange('fechaVencimiento', formatExpiry(e.target.value))}
                    placeholder="MM/AA"
                    maxLength="5"
                    required
                    className={fieldErrors.fechaVencimiento ? 'input-error' : ''}
                  />
                  {fieldErrors.fechaVencimiento && (
                    <span className="error-text">{fieldErrors.fechaVencimiento}</span>
                  )}
                </label>
                
                <label>
                  Nombre en Tarjeta*
                  <input 
                    type="text" 
                    value={form.nombreEnTarjeta} 
                    onChange={e => handleInputChange('nombreEnTarjeta', e.target.value)}
                    placeholder="Como aparece en la tarjeta"
                    required
                    className={fieldErrors.nombreEnTarjeta ? 'input-error' : ''}
                  />
                  {fieldErrors.nombreEnTarjeta && (
                    <span className="error-text">{fieldErrors.nombreEnTarjeta}</span>
                  )}
                </label>
              </div>
              
              <div className="security-notice">
                <Shield size={16} />
                <small>Tu información está protegida y encriptada</small>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {isEditing ? 'Guardar Cambios' : 'Agregar Tarjeta'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)} disabled={loading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
