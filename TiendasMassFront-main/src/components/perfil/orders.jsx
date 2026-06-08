import React, { useEffect, useState } from 'react';
import { useUsuario } from '../../context/userContext';
import '../../styles/perfil.css';

const API_URL = "http://localhost:5001";

const Orders = () => {
  const { usuario } = useUsuario();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!usuario?.id) return;

      try {
        const res = await fetch(`${API_URL}/api/pedidos/usuario/${usuario.id}`);
        const data = await res.json();

        const pedidosFormateados = (data.pedidos || []).map(p => {
          const tipoEnvio = p.shippingMethod ? p.shippingMethod.nombre : 'Recojo en tienda';

          let direccionSede = 'N/A';
          if (p.direccion) {
            direccionSede = `${p.direccion.nombre || ''} - ${p.direccion.calle}, ${p.direccion.ciudad} ${p.direccion.codigoPostal || ''}`.trim();
          } else if (p.direccionEnvio) {
            direccionSede = p.direccionEnvio;
          }

          return {
            id: p.id,
            fecha: p.fechaPedido,
            items: p.detallesPedidos || [],
            total: parseFloat(p.montoTotal),
            status: p.estado.charAt(0).toUpperCase() + p.estado.slice(1),
            tipoEnvio,
            direccionSede
          };
        });

        setOrders(pedidosFormateados);
      } catch (err) {
        console.error('Error al obtener pedidos:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [usuario]);

  const totalGastado = orders.reduce((acc, o) => acc + parseFloat(o.total), 0).toFixed(2);
  const pedidosEnProceso = orders.filter(o => o.status === 'En Proceso').length;

  return (
    <div className="orders-section">

      {/* HEADER */}
      <div className="section-header">
        <div className="header-content">
          <h2>Mis Pedidos</h2>
          <p>Historial de todas tus compras</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{orders.length}</div>
          <div className="stat-label">Total Pedidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">S/ {totalGastado}</div>
          <div className="stat-label">Gastado Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pedidosEnProceso}</div>
          <div className="stat-label">En Proceso</div>
        </div>
      </div>

      {/* LISTADO */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-orders">
          <p>No tienes pedidos aún.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-main">
                <div className="order-info">
                  <div className="order-id">Pedido #{order.id}</div>
                  <div className="order-date">
                    {new Date(order.fecha).toLocaleDateString()}
                  </div>

                  <div className="order-items">
                    <div>
                      {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                    </div>

                    {order.items.length > 0 && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="ver-mas-btn"
                      >
                        ver más...
                      </button>
                    )}
                  </div>
                </div>

                <div className="order-status-section">
                  <span
                    className={`order-status status-${order.status.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {order.status}
                  </span>
                  <div className="order-total">
                    S/ {parseFloat(order.total).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL FACTURA ================= */}

      {selectedOrder && (
        <div className="modal show d-block factura-overlay">
          <div className="modal-dialog modal-lg factura-dialog">
            <div className="modal-content border-0 shadow-lg factura-content">

              {/* Header */}
              <div className="modal-header factura-header">
                <h5 className="modal-title factura-title">
                  Detalles del Pedido #{selectedOrder.id}
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body factura-body">

                {/* Resumen */}
                <div className="row g-3 mb-3 factura-resumen">
                  <div className="col-md-6 factura-bloque">
                    <p className="factura-label">Fecha del Pedido</p>
                    <p className="factura-valor">
                      {new Date(selectedOrder.fecha).toLocaleDateString()}
                    </p>

                    <p className="factura-label mt">Tipo de envío</p>
                    <p className="factura-valor">{selectedOrder.tipoEnvio}</p>
                  </div>

                  <div className="col-md-6 factura-bloque">
                    <p className="factura-label">Estado del pedido</p>
                    <span
                      className={`order-status status-${selectedOrder.status.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {selectedOrder.status}
                    </span>

                    <p className="factura-label mt">Total pagado</p>
                    <p className="factura-total">
                      S/ {parseFloat(selectedOrder.total).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Dirección */}
                <div className="factura-direccion">
                  <p className="factura-label">Dirección / Sede</p>
                  <p className="factura-valor">{selectedOrder.direccionSede}</p>
                </div>

                {/* Productos */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="mt-3">
                   
                    <div className="table-responsive">
                      <table className="table table-sm align-middle factura-tabla">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th className="text-end">Precio Unit.</th>
                            <th className="text-end">Subtotal</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedOrder.items.map((detalle, index) => (
                            <tr key={index}>
                              <td>{detalle.producto?.nombre || 'N/A'}</td>
                              <td>{detalle.cantidad}</td>
                              <td className="text-end">
                                S/. {parseFloat(detalle.precio || 0).toFixed(2)}
                              </td>
                              <td className="text-end">
                                S/. {((detalle.cantidad || 0) * parseFloat(detalle.precio || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        <tfoot>
                          {(() => {
                            const subtotalProductos = selectedOrder.items.reduce(
                              (sum, d) => sum + (d.cantidad || 0) * parseFloat(d.precio || 0), 0
                            );

                            const impuestos = subtotalProductos * 0.08;
                            const tieneEnvio = selectedOrder.tipoEnvio !== 'Recojo en tienda';
                            const subtotalConImpuestos = subtotalProductos + impuestos;
                            const diferencia = parseFloat(selectedOrder.total) - subtotalConImpuestos;

                            let envio = 0;
                            let comision = 0;

                            if (tieneEnvio && diferencia > 0) envio = diferencia;
                            else comision = diferencia;

                            return (
                              <>
                                <tr>
                                  <td colSpan="3" className="text-end">Subtotal productos:</td>
                                  <td className="text-end">S/. {subtotalProductos.toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td colSpan="3" className="text-end">Impuestos (8%):</td>
                                  <td className="text-end">S/. {impuestos.toFixed(2)}</td>
                                </tr>

                                {tieneEnvio && envio > 0 && (
                                  <tr>
                                    <td colSpan="3" className="text-end">Envío:</td>
                                    <td className="text-end">S/. {envio.toFixed(2)}</td>
                                  </tr>
                                )}

                                {comision > 0 && (
                                  <tr>
                                    <td colSpan="3" className="text-end">Comisión método de pago:</td>
                                    <td className="text-end">S/. {comision.toFixed(2)}</td>
                                  </tr>
                                )}

                                <tr className="factura-total-row">
                                  <td colSpan="3" className="text-end fw-bold">Total:</td>
                                  <td className="text-end fw-bold fs-6">
                                    S/. {parseFloat(selectedOrder.total).toFixed(2)}
                                  </td>
                                </tr>
                              </>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="modal-footer factura-footer">
                <img
                  src="/src/assets/logo.png"
                  alt="Logo Tiendas Mass"
                  className="factura-logo"
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
