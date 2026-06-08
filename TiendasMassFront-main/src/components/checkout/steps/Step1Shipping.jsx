// steps/Step1Shipping.jsx
import React, { useEffect, useState } from 'react';
import { MapPin, User, Mail, Phone, Truck, Store, RefreshCw, Home, Hash, Info, Star } from 'lucide-react';
import { useCarrito } from '../../../context/carContext';
import { useUsuario } from '../../../context/userContext';

const API_URL = "http://localhost:5001";


const Step1Shipping = ({
  formData,
  updateFormData,
  validation,
  metodosEnvio,
  selectedMetodoEnvioId,
  setSelectedMetodoEnvioId,
  userAddresses,
  reloadUserAddresses,
  selectedAddressId,
  handleAddressChange,
  useCustomAddress
}) => {

  // 🔹 Hooks propios del componente (NO BORRAR)
  const { carrito, aumentarCantidad, disminuirCantidad, quitarProducto } = useCarrito();
  const { usuario } = useUsuario();

  // 🔹 NUEVO: tiendas desde backend
  const [tiendas, setTiendas] = useState([]);
  const [loadingTiendas, setLoadingTiendas] = useState(false);

  useEffect(() => {
    const loadTiendas = async () => {
      try {
        setLoadingTiendas(true);
        const res = await fetch(`${API_URL}/api/tiendas/activas`);
        if (!res.ok) throw new Error('Error al cargar tiendas');
        const data = await res.json();
        setTiendas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setTiendas([]);
      } finally {
        setLoadingTiendas(false);
      }
    };

    loadTiendas();
  }, []);

  // 🔹 Utilidades (NO BORRAR)
  const parsePrice = (p) => (typeof p === 'number' ? p : (parseFloat(p) || 0));
  const normalizeImageUrl = (url) => {
    if (!url) return '/placeholder-image.jpg';
    return url.replace('http://localhost:3000', 'http://localhost:5001');
  };

  // 🔹 Handler (NO BORRAR)
  const handleFieldChange = (field, value) => {
    updateFormData(field, value);
    validation.validateSingleField(field, value);
  };

  return (
    <>
      {/* Resumen de Productos */}
      <div className="section-box payment-section">
        <h2><span>1</span> Resumen de Productos</h2>
        {carrito.length === 0 ? (
          <div className="empty-cart"><p>Tu carrito está vacío</p></div>
        ) : (
          carrito.map(item => (
            <div key={item.id} className="cart-item">
              <img
                src={normalizeImageUrl(item.imagen ? `http://localhost:5001/${item.imagen}` : '/placeholder-image.jpg')}
                alt={item.nombre}
                onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
              />
              <div className="cart-item-info">
                <strong>{item.title || item.nombre || 'Producto sin nombre'}</strong>
                <small> S/.{parsePrice(item.precio).toFixed(2)} c/u</small>
              </div>
              <div className="cart-item-actions">
                <button onClick={() => disminuirCantidad(item.id)} disabled={item.cantidad <= 1}>-</button>
                <span>{item.cantidad}</span>
                <button onClick={() => aumentarCantidad(item.id)}>+</button>
                <button className="remove" onClick={() => quitarProducto(item.id)} title="Eliminar producto">✕</button>
              </div>
              <div className="cart-item-total">S/.{(parsePrice(item.precio) * item.cantidad).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>

      {/* Información de Envío */}
      <div className="section-box shipping-form-container active">
        <div className="shipping-header">
          <div className="shipping-step-badge selected">2</div>
          <h2 className="shipping-title">Información de Envío</h2>
        </div>

        <div className="delivery-options">
          <button
            className={`delivery-btn ${formData.deliveryType === 'delivery' ? 'selected' : ''}`}
            onClick={() => handleFieldChange('deliveryType', 'delivery')}
          >
            <Truck className="delivery-icon" />
            <div>
              <div className="delivery-label">Envío a Domicilio</div>
              <div className="delivery-sub">Recibe en tu dirección</div>
            </div>
          </button>
          <button
            className={`delivery-btn ${formData.deliveryType === 'pickup' ? 'selected' : ''}`}
            onClick={() => handleFieldChange('deliveryType', 'pickup')}
          >
            <Store className="delivery-icon" />
            <div>
              <div className="delivery-label">Recojo en Tienda</div>
              <div className="delivery-sub">Retira en nuestro local (Gratis)</div>
            </div>
          </button>
        </div>

        {/* Selector de método de envío cuando es delivery */}
        {formData.deliveryType === 'delivery' && metodosEnvio.length > 0 && (
          <div className="form-group">
            <label className="form-label">Método de Envío *</label>
            <select
              className="form-select"
              value={selectedMetodoEnvioId || ''}
              onChange={(e) => setSelectedMetodoEnvioId(Number(e.target.value))}
            >
              <option value="">Seleccionar método de envío</option>
              {metodosEnvio.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} — S/.{parsePrice(m.precio).toFixed(2)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group full">
            <label className="form-label"><User className="form-icon" />Nombre Completo *</label>
            <input
              className={`form-input ${validation.getFieldError('fullName').length > 0 ? 'input-error' : ''}`}
              value={formData.fullName || ''}
              onChange={e => handleFieldChange('fullName', e.target.value)}
            />
            {validation.getFieldError('fullName').map((error, index) => (
              <div key={index} className="error-messages">
                <span className="error-text">{error}</span>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label"><Mail className="form-icon" />Correo Electrónico *</label>
            <input
              className={`form-input ${validation.getFieldError('email').length > 0 ? 'input-error' : ''}`}
              type="email"
              value={formData.email || ''}
              onChange={e => handleFieldChange('email', e.target.value)}
            />
            {validation.getFieldError('email').map((error, index) => (
              <div key={index} className="error-messages">
                <span className="error-text">{error}</span>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label"><Phone className="form-icon" />Teléfono *</label>
            <input
              className={`form-input ${validation.getFieldError('phone').length > 0 ? 'input-error' : ''}`}
              type="tel"
              value={formData.phone || ''}
              onChange={e => handleFieldChange('phone', e.target.value)}
              maxLength="15"
              placeholder="987654321 o 01 234567"
            />
            {validation.getFieldError('phone').map((error, index) => (
              <div key={index} className="error-messages">
                <span className="error-text">{error}</span>
              </div>
            ))}
          </div>

          {formData.deliveryType === 'pickup' && (
            <div className="form-group full">
              <label className="form-label">
                <Store className="form-icon" />Seleccionar Tienda *
              </label>

              <select
                className={`form-select ${validation.getFieldError('selectedStore').length > 0 ? 'input-error' : ''}`}
                value={formData.selectedStore || ''}
                onChange={e => handleFieldChange('selectedStore', e.target.value)}
                disabled={loadingTiendas}
              >
                <option value="">
                  {loadingTiendas ? 'Cargando tiendas...' : 'Seleccionar tienda'}
                </option>

                {tiendas.map(t => (
                  <option key={t.id} value={String(t.id)}>
                    {t.nombre}
                    {t.direccion ? ` — ${t.direccion}` : ''}
                    {t.telefono ? ` | Tel: ${t.telefono}` : ''}
                  </option>
                ))}
              </select>

              {!loadingTiendas && tiendas.length === 0 && (
                <div className="error-messages">
                  <span className="error-text">No hay tiendas disponibles para recojo.</span>
                </div>
              )}

              {validation.getFieldError('selectedStore').map((error, index) => (
                <div key={index} className="error-messages">
                  <span className="error-text">{error}</span>
                </div>
              ))}
            </div>
          )}


          {formData.deliveryType === 'delivery' && (
            <>
              {usuario && (
                <div className="form-group full">
                  <label className="form-label"><MapPin className="form-icon" />Seleccionar Dirección</label>
                  <div className="address-selector">
                    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                      <select
                        className="form-select"
                        value={selectedAddressId ? String(selectedAddressId) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleAddressChange(val);
                          if (val && val !== 'custom') {
                            const addr = userAddresses.find(a => String(a.id) === String(val));
                            if (addr) {
                              updateFormData('address', addr.calle || '');
                              updateFormData('city', addr.ciudad || '');
                              updateFormData('zipCode', addr.codigoPostal || '');
                              updateFormData('reference', addr.referencia || '');
                            }
                          } else if (val === 'custom') {
                            updateFormData('address', '');
                            updateFormData('city', '');
                            updateFormData('zipCode', '');
                            updateFormData('reference', '');
                          }
                        }}
                        disabled={userAddresses.length === 0}
                      >
                        <option value="">{userAddresses.length === 0 ? 'No tienes direcciones guardadas' : 'Seleccionar dirección guardada'}</option>
                        {userAddresses.map(address => (
                          <option key={address.id} value={address.id.toString()}>
                            {address.nombre} - {address.calle}, {address.ciudad}{address.esPrincipal && ' (Principal)'}
                          </option>
                        ))}
                        <option value="custom">+ Agregar dirección nueva</option>
                      </select>
                      <div style={{display: 'flex', gap: 8}}>
                        <button type="button" className="btn-tertiary btn-small" onClick={async () => {
                          if (typeof reloadUserAddresses === 'function') await reloadUserAddresses();
                        }} title="Recargar direcciones" aria-label="Recargar direcciones">
                          <RefreshCw className="btn-icon" />
                          <span>Recargar</span>
                        </button>
                        <a href="/perfil#addresses" className="btn-tertiary btn-small" aria-label="Ir a mis direcciones">Ir a Mis Direcciones</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAddressId && selectedAddressId !== 'custom' && !useCustomAddress && (
                <div className="form-group full">
                  <div className="selected-address-display">
                    <strong>Dirección seleccionada:</strong>
                    {(() => {
                      const a = userAddresses.find(addr => addr.id.toString() === selectedAddressId);
                      return a ? (
                        <div className="address-info">
                          <div className="address-row"><User className="address-icon" /> <span className="address-label">Nombre:</span> <span className="address-value">{a.nombre || a.alias || '—'}</span></div>
                          <div className="address-row"><MapPin className="address-icon" /> <span className="address-label">Dirección:</span> <span className="address-value">{a.calle || '—'}</span></div>
                          <div className="address-row"><Home className="address-icon" /> <span className="address-label">Ciudad:</span> <span className="address-value">{a.ciudad || '—'}</span></div>
                          <div className="address-row"><Hash className="address-icon" /> <span className="address-label">Código postal:</span> <span className="address-value">{a.codigoPostal || a.zipCode || '—'}</span></div>
                          {a.referencia && <div className="address-row"><Info className="address-icon" /> <span className="address-label">Referencia:</span> <span className="address-value">{a.referencia}</span></div>}
                          {a.telefono && <div className="address-row"><Phone className="address-icon" /> <span className="address-label">Teléfono:</span> <span className="address-value">{a.telefono}</span></div>}
                          {a.esPrincipal && <div className="address-row"><Star className="address-icon" /> <span className="address-label">Principal:</span> <span className="address-value">Sí</span></div>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {(useCustomAddress || !usuario || userAddresses.length === 0) && (
                <>
                  <div className="form-group full">
                    <label className="form-label"><MapPin className="form-icon" />Dirección *</label>
                    <input
                      className={`form-input ${validation.getFieldError('address').length > 0 ? 'input-error' : ''}`}
                      value={formData.address || ''}
                      onChange={e => handleFieldChange('address', e.target.value)}
                      placeholder="Calle, número, departamento"
                    />
                    {validation.getFieldError('address').map((error, index) => (
                      <div key={index} className="error-messages">
                        <span className="error-text">{error}</span>
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ciudad *</label>
                    <input
                      className={`form-input ${validation.getFieldError('city').length > 0 ? 'input-error' : ''}`}
                      value={formData.city || ''}
                      onChange={e => handleFieldChange('city', e.target.value)}
                      placeholder="Lima, Arequipa, etc."
                    />
                    {validation.getFieldError('city').map((error, index) => (
                      <div key={index} className="error-messages">
                        <span className="error-text">{error}</span>
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código Postal *</label>
                    <input
                      className={`form-input ${validation.getFieldError('zipCode').length > 0 ? 'input-error' : ''}`}
                      value={formData.zipCode || ''}
                      onChange={e => handleFieldChange('zipCode', e.target.value)}
                      placeholder="15001"
                    />
                    {validation.getFieldError('zipCode').map((error, index) => (
                      <div key={index} className="error-messages">
                        <span className="error-text">{error}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Step1Shipping;