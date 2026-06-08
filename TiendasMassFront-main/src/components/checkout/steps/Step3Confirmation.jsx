// steps/Step3Confirmation.jsx
import React from 'react';
import { Check, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const Step3Confirmation = ({ pedidoCreado }) => {
  const getPaymentStatusText = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return 'Completado';
      case 'PENDIENTE': return 'Pendiente de pago';
      case 'PENDIENTE_VERIFICACION': return 'Verificación Pendiente';
      case 'FALLIDO': return 'Falló';
      default: return estado || 'Pendiente';
    }
  };

  const getPaymentStatusIcon = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return <Check size={20} />;
      case 'PENDIENTE':
      case 'PENDIENTE_VERIFICACION': return <Clock size={20} />;
      default: return <Clock size={20} />;
    }
  };

  const getPaymentStatusBg = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return '#d4edda';
      case 'PENDIENTE':
      case 'PENDIENTE_VERIFICACION': return '#fff3cd';
      case 'FALLIDO': return '#f8d7da';
      default: return '#e7f3ff';
    }
  };

  const getPaymentStatusBorder = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return '#28a745';
      case 'PENDIENTE':
      case 'PENDIENTE_VERIFICACION': return '#ff9800';
      case 'FALLIDO': return '#dc3545';
      default: return '#0066cc';
    }
  };

  const getPaymentStatusColor = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'COMPLETADO': return '#28a745';
      case 'PENDIENTE':
      case 'PENDIENTE_VERIFICACION': return '#ff9800';
      case 'FALLIDO': return '#dc3545';
      default: return '#0066cc';
    }
  };

  if (!pedidoCreado) {
    return <div className="loading">Cargando confirmación...</div>;
  }

  return (
    <div className="receipt-container">
      {/* ✅ HEADER CON ÉXITO */}
      <div className="receipt-header">
        <div className="receipt-success-badge">
          <Check size={28} />
        </div>
        <h1>¡Pedido Confirmado!</h1>
        <p>Gracias por tu compra en Tiendas Mass</p>
      </div>

      {/* 📋 RECIBO PRINCIPAL */}
      <div className="receipt-card">
        {/* Número de Orden */}
        <div className="receipt-order-number">
          <p className="label">Número de Pedido</p>
          <h2>#{pedidoCreado.id}</h2>
        </div>

        {/* Línea divisoria */}
        <hr className="receipt-divider" />

        {/* Estado del Pago - Badge prominente */}
        <div className="payment-status-badge" style={{ backgroundColor: getPaymentStatusBg(pedidoCreado.estadoPago), borderLeftColor: getPaymentStatusBorder(pedidoCreado.estadoPago) }}>
          <div className="status-icon" style={{ color: getPaymentStatusColor(pedidoCreado.estadoPago) }}>
            {getPaymentStatusIcon(pedidoCreado.estadoPago)}
          </div>
          <div className="status-info">
            <p className="status-label">Estado del Pago</p>
            <p className="status-value" style={{ color: getPaymentStatusColor(pedidoCreado.estadoPago) }}>
              {getPaymentStatusText(pedidoCreado.estadoPago)}
            </p>
          </div>
        </div>

        {/* Información principal */}
        <div className="receipt-info-grid">
          <div className="info-item">
            <p className="info-label">💳 Método de Pago</p>
            <p className="info-value">{pedidoCreado.metodoPago?.nombre || 'N/A'}</p>
          </div>
          <div className="info-item">
            <p className="info-label">📦 Estado del Pedido</p>
            <p className="info-value">{pedidoCreado.estado}</p>
          </div>
          <div className="info-item">
            <p className="info-label">🚚 Entrega</p>
            <p className="info-value">{pedidoCreado.direccionEnvio}</p>
          </div>
        </div>

        {/* Línea divisoria */}
        <hr className="receipt-divider" />

        {/* Productos */}
        <div className="receipt-products">
          <h3>Resumen de tu Pedido</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(pedidoCreado.detallesPedidos || []).map((item, index) => (
                <tr key={index} className="product-row">
                  <td className="product-name">{item.nombre || item.producto?.nombre || 'Producto sin nombre'}</td>
                  <td style={{ textAlign: 'center', color: '#666' }}>x{item.cantidad}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency((item.precio || 0) * item.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Línea divisoria */}
        <hr className="receipt-divider" />

        {/* Totales */}
        <div className="receipt-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(pedidoCreado.resumen?.subtotal || 0)}</span>
          </div>
          <div className="total-row">
            <span>Envío</span>
            <span>{formatCurrency(pedidoCreado.resumen?.shippingCost || 0)}</span>
          </div>
          <div className="total-row">
            <span>Impuestos (8%)</span>
            <span>{formatCurrency(pedidoCreado.resumen?.impuestos || 0)}</span>
          </div>
          {pedidoCreado.resumen?.comision > 0 && (
            <div className="total-row">
              <span>Comisión de pago</span>
              <span>{formatCurrency(pedidoCreado.resumen?.comision || 0)}</span>
            </div>
          )}
          <div className="total-row total-final">
            <span>TOTAL A PAGAR</span>
            <span>{formatCurrency(pedidoCreado.montoTotal || 0)}</span>
          </div>
        </div>

        {/* Línea divisoria */}
        <hr className="receipt-divider" />

        {/* Instrucciones según método de pago */}
        {(pedidoCreado.estadoPago === 'PENDIENTE_VERIFICACION' || pedidoCreado.estadoPago === 'PENDIENTE') && (
          <div className="payment-instructions">
            <h3>📋 Próximos Pasos</h3>
            {pedidoCreado.metodoPago?.nombre?.toLowerCase().includes('efectivo') && (
              <div className="instruction-item">
                <div className="instruction-step">1</div>
                <div>
                  <strong>Pago en Efectivo</strong>
                  <p>Realiza el pago al momento de recibir tu pedido. Nuestro repartidor aceptará dinero exacto o puede dar cambio.</p>
                </div>
              </div>
            )}
            {pedidoCreado.metodoPago?.nombre?.toLowerCase().includes('transferencia') && (
              <div className="instruction-item">
                <div className="instruction-step">1</div>
                <div>
                  <strong>Transferencia Bancaria</strong>
                  <p>Realiza una transferencia al monto total. Recibirás un correo con los datos bancarios e instrucciones detalladas.</p>
                </div>
              </div>
            )}
            {pedidoCreado.metodoPago?.nombre?.toLowerCase().includes('billetera') && (
              <div className="instruction-item">
                <div className="instruction-step">1</div>
                <div>
                  <strong>Billetera Digital</strong>
                  <p>Completa el pago usando tu billetera digital (Yape, Plin, etc.). Recibirás un código por correo.</p>
                </div>
              </div>
            )}
            <div className="instruction-item">
              <div className="instruction-step">2</div>
              <div>
                <strong>Confirmación por Correo</strong>
                <p>Se enviará un correo de confirmación con todos los detalles de tu pedido y seguimiento.</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-step">3</div>
              <div>
                <strong>Entrega</strong>
                <p>Recibirás tu pedido en la dirección registrada. Puedes dar seguimiento desde tu cuenta.</p>
              </div>
            </div>
          </div>
        )}

        {pedidoCreado.estadoPago === 'COMPLETADO' && (
          <div className="completion-message">
            <p>✅ Tu pago fue procesado exitosamente. Tu pedido está en preparación y será entregado pronto.</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="receipt-actions">
        <button className="btn-primary" onClick={() => { window.location.href = '/'; }}>
          Continuar Comprando
        </button>
        <button className="btn-secondary" onClick={() => window.print()}>
          📥 Descargar Recibo
        </button>
      </div>
    </div>
  );
};

export default Step3Confirmation;