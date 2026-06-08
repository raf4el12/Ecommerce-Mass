// components/OrderSummary.jsx
import React from 'react';
import { Lock, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const OrderSummary = ({
  carrito,
  totals,
  activeStep,
  pedidoCreado,
  onPlaceOrder,
  loading,
  showMpWallet,
  disabled
}) => {
  const normalizeImageUrl = (url) => {
    if (!url) return '/placeholder-image.jpg';
    return url.replace('http://localhost:3000', 'http://localhost:5001');
  };

  return (
    <div className="order-summary">
      <h3>Resumen del Pedido</h3>

      <div className="order-items">
        {activeStep === 3 && pedidoCreado ? (
          (pedidoCreado.detallesPedidos || []).map((item, index) => (
            <div key={index} className="order-item">
              <div className="item-info">
                <span className="item-name">{item.nombre || item.producto?.nombre || 'Producto sin nombre'}</span>
                <span className="item-quantity">x{item.cantidad}</span>
              </div>
              <span className="item-price">{formatCurrency((item.precio || 0) * item.cantidad)}</span>
            </div>
          ))
        ) : (
          carrito.length > 0 ? (
            carrito.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.title || item.nombre}</span>
                  <span className="item-quantity">x{item.cantidad}</span>
                </div>
                <span className="item-price">{formatCurrency((item.precio || 0) * item.cantidad)}</span>
              </div>
            ))
          ) : (
            <div>No hay productos en el carrito.</div>
          )
        )}
      </div>

      <hr />

      <div className="summary-row">
        <span>Subtotal ({carrito.length} productos)</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>
      <div className="summary-row">
        <span>Envío</span>
        <span>{formatCurrency(totals.shippingCost)}</span>
      </div>
      <div className="summary-row">
        <span>Impuestos</span>
        <span>{formatCurrency(totals.impuestos)}</span>
      </div>
      {totals.comision > 0 && (
        <div className="summary-row">
          <span>Comisión</span>
          <span>{formatCurrency(totals.comision)}</span>
        </div>
      )}
      <div className="summary-total">
        <strong>Total</strong>
        <strong>{formatCurrency(totals.total)}</strong>
      </div>

      <div className="secure-box">
        <p><Lock size={16} /> Pago 100% seguro</p>
        <p><RotateCcw size={16} /> Devoluciones fáciles 30 días</p>
      </div>

      {activeStep < 3 && (
        <button
          className="place-order"
          onClick={onPlaceOrder}
          disabled={disabled || loading || showMpWallet}
        >
          {loading ? 'Procesando...' : showMpWallet ? 'Procesa en Mercado Pago' : (activeStep === 1 ? 'Continuar' : 'Realizar Pedido')}
        </button>
      )}
    </div>
  );
};

export default OrderSummary;