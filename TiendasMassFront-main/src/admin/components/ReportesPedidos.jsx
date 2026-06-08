import React, { useState, useEffect } from 'react';
import { Eye, Download, Search, Printer, X as CloseIcon } from 'lucide-react';
import axios from 'axios';
import swal from 'sweetalert2';
import AdminTable, {
  StatusBadge,
  RowActions,
  RowAction,
} from './AdminTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const API_URL = "http://localhost:5001/api/pedidos";

const OrderReports = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los pedidos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.usuario?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === '' || order.estado === selectedStatus;
    
    const matchesDate = dateFilter === '' || 
      new Date(order.fechaPedido).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'entregado': return 'text-success bg-success/10';
      case 'enviado': return 'text-mass-yellow bg-mass-yellow/10';
      case 'confirmado': return 'text-trust-blue bg-trust-blue/10';
      case 'pendiente': return 'text-on-surface-variant bg-surface-container-highest';
      case 'cancelado': return 'text-error bg-error/10';
      default: return 'text-on-surface-variant bg-surface-container-highest';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'entregado': return 'Entregado';
      case 'enviado': return 'Enviado';
      case 'confirmado': return 'Confirmado';
      case 'pendiente': return 'Pendiente';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getTotalSales = () => {
    return filteredOrders.reduce((sum, order) => sum + parseFloat(order.montoTotal), 0);
  };

  const getOrdersByStatus = () => {
    const statusCount = { 'pendiente': 0, 'confirmado': 0, 'enviado': 0, 'entregado': 0, 'cancelado': 0 };
    filteredOrders.forEach(order => {
      if(statusCount[order.estado] !== undefined) statusCount[order.estado]++;
    });
    return statusCount;
  };

  const getItemsCount = (order) => {
    return order.detallesPedidos?.reduce((sum, detalle) => sum + detalle.cantidad, 0) || 0;
  };

  const handleExport = () => {
    const csvContent = [
      ['ID Pedido', 'Cliente', 'Total', 'Estado', 'Artículos', 'Fecha', 'Método de Pago', 'Estado Pago'],
      ...filteredOrders.map(order => [
        order.id,
        order.usuario?.nombre || 'N/A',
        order.montoTotal.toString(),
        getStatusText(order.estado),
        getItemsCount(order).toString(),
        new Date(order.fechaPedido).toLocaleDateString(),
        order.metodoPago?.nombre || 'N/A',
        order.estadoPago
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/${orderId}`, { estado: newStatus });
      setOrders(orders.map(order => order.id === orderId ? { ...order, estado: newStatus } : order));
      swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: 'El estado del pedido ha sido actualizado correctamente',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del pedido',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'confirmado', label: 'Confirmado' },
      { value: 'enviado', label: 'Enviado' },
      { value: 'entregado', label: 'Entregado' },
      { value: 'cancelado', label: 'Cancelado' }
    ];
    return allStatuses.filter(status => status.value !== currentStatus);
  };

  const statusCounts = getOrdersByStatus();

  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            .customer-info, .order-details { margin-bottom: 15px; }
            .products-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .products-table th, .products-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .products-table th { background-color: #f2f2f2; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
            .status-badge { background-color: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tiendas Mass</h1>
            <h2>Pedido #${order.id}</h2>
            <p>Fecha: ${new Date(order.fechaPedido).toLocaleDateString()}</p>
          </div>
          <div class="order-info">
            <div class="customer-info">
              <h3>Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${order.usuario?.nombre || 'N/A'}</p>
              <p><strong>Email:</strong> ${order.usuario?.email || 'N/A'}</p>
              <p><strong>Dirección de Envío:</strong> ${order.direccionEnvio || 'N/A'}</p>
            </div>
            <div class="order-details">
              <h3>Detalles del Pedido</h3>
              <p><strong>Estado:</strong> <span class="status-badge">${getStatusText(order.estado)}</span></p>
              <p><strong>Método de Pago:</strong> ${order.metodoPago?.nombre || 'N/A'}</p>
              <p><strong>Estado de Pago:</strong> ${order.estadoPago}</p>
            </div>
          </div>
          ${order.detallesPedidos && order.detallesPedidos.length > 0 ? `
            <div class="products">
              <h3>Productos</h3>
              <table class="products-table">
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr></thead>
                <tbody>
                  ${order.detallesPedidos.map(detalle => `
                    <tr><td>${detalle.producto?.nombre || 'N/A'}</td><td>${detalle.cantidad}</td><td>S/.${parseFloat(detalle.precio).toFixed(2)}</td><td>S/.${(detalle.cantidad * parseFloat(detalle.precio)).toFixed(2)}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>` : ''}
          <div class="total"><p><strong>Total a Pagar: S/.${parseFloat(order.montoTotal).toFixed(2)}</strong></p></div>
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()">Imprimir</button>
            <button onclick="window.close()">Cerrar</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (o) => <span className="font-semibold text-on-surface">#{o.id}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (o) => <span className="text-on-surface-variant">{o.usuario?.nombre || 'N/A'}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (o) => <span className="font-bold text-trust-blue">S/.{parseFloat(o.montoTotal).toFixed(2)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (o) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-bold text-label-bold ${getStatusBadgeVariant(o.estado)}`}>
          {getStatusText(o.estado)}
        </span>
      ),
    },
    {
      key: 'articulos',
      header: 'Artículos',
      render: (o) => <span className="text-on-surface-variant">{getItemsCount(o)} items</span>,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (o) => <span className="text-on-surface-variant text-sm">{new Date(o.fechaPedido).toLocaleDateString()}</span>,
    },
    {
      key: 'pago',
      header: 'Pago',
      render: (o) => (
        <div className="flex flex-col">
          <span className="text-sm text-on-surface-variant">{o.metodoPago?.nombre || 'N/A'}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${o.estadoPago === 'completado' ? 'text-success' : 'text-mass-yellow'}`}>
            {o.estadoPago}
          </span>
        </div>
      ),
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (o) => (
        <div className="flex items-center justify-end gap-2">
          <select
            className="text-sm bg-surface-grey border border-outline-variant rounded px-2 py-1 outline-none focus:border-trust-blue"
            value={o.estado}
            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
            disabled={loading}
          >
            <option value={o.estado}>{getStatusText(o.estado)}</option>
            {getStatusOptions(o.estado).map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <RowActions>
            <RowAction icon={Eye} label="Ver Detalles" onClick={() => setShowOrderDetails(o)} disabled={loading} />
          </RowActions>
        </div>
      ),
    },
  ];

  const extraFilters = (
    <>
      <input
        type="date"
        className="w-full md:w-auto bg-surface-grey border-2 border-transparent focus:border-trust-blue rounded-lg px-4 py-2 min-h-[44px] font-body-md text-body-md text-on-background outline-none transition-colors shadow-sm"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
      />
      <select
        className="w-full md:w-auto bg-surface-grey border-2 border-transparent focus:border-trust-blue rounded-lg px-4 py-2 min-h-[44px] font-body-md text-body-md text-on-background outline-none transition-colors shadow-sm"
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmado">Confirmado</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
        <option value="cancelado">Cancelado</option>
      </select>
    </>
  );

  return (
    <>
      <div className="px-margin-mobile md:px-margin-desktop pt-6 max-w-container-max mx-auto w-full fade-in space-y-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
            Reportes de Pedidos
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Analiza y gestiona los pedidos del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex flex-col border-l-4 border-l-trust-blue">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Total Pedidos</span>
            <span className="font-headline-lg text-on-surface mt-2">{filteredOrders.length}</span>
          </Card>
          <Card className="flex flex-col border-l-4 border-l-mass-yellow">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Ventas Totales</span>
            <span className="font-headline-lg text-on-surface mt-2">S/.{getTotalSales().toFixed(2)}</span>
          </Card>
          <Card className="flex flex-col border-l-4 border-l-success">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Entregados</span>
            <span className="font-headline-lg text-on-surface mt-2">{statusCounts.entregado}</span>
          </Card>
          <Card className="flex flex-col border-l-4 border-l-error">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Pendientes</span>
            <span className="font-headline-lg text-on-surface mt-2">{statusCounts.pendiente}</span>
          </Card>
        </div>

        <AdminTable
          columns={columns}
          data={filteredOrders}
          loading={loading && orders.length === 0}
          empty={searchTerm || dateFilter || selectedStatus ? 'No se encontraron pedidos con estos filtros' : 'No hay pedidos registrados'}
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Buscar por ID o cliente...',
          }}
          extraFilters={extraFilters}
          exportAction={{
            label: 'Exportar CSV',
            icon: Download,
            onClick: handleExport,
          }}
          pagination={{
            page: 1, 
            totalItems: filteredOrders.length,
            pageSize: 10,
            onPageChange: () => {} 
          }}
        />

        {showOrderDetails && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-tint/40 backdrop-blur-sm"
            onClick={() => setShowOrderDetails(null)}
          >
            <Card
              className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col !p-0 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface sticky top-0 z-10">
                <h3 className="font-headline-md text-headline-md text-trust-blue">
                  Detalles del Pedido #{showOrderDetails.id}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(null)}
                  disabled={loading}
                  className="p-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-surface">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h6 className="font-label-bold text-lg text-on-surface border-b pb-2">Información del Cliente</h6>
                    <div className="space-y-2 text-body-md text-on-surface">
                      <p><strong className="text-on-surface-variant">Nombre:</strong> {showOrderDetails.usuario?.nombre || 'N/A'}</p>
                      <p><strong className="text-on-surface-variant">Email:</strong> {showOrderDetails.usuario?.email || 'N/A'}</p>
                      <p><strong className="text-on-surface-variant">Fecha:</strong> {new Date(showOrderDetails.fechaPedido).toLocaleDateString()}</p>
                      <p><strong className="text-on-surface-variant">Dirección:</strong> {showOrderDetails.direccionEnvio || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h6 className="font-label-bold text-lg text-on-surface border-b pb-2">Información del Pedido</h6>
                    <div className="space-y-3 text-body-md text-on-surface">
                      <div className="flex items-center gap-2">
                        <strong className="text-on-surface-variant">Estado:</strong> 
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${getStatusBadgeVariant(showOrderDetails.estado)}`}>
                          {getStatusText(showOrderDetails.estado)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <strong className="text-on-surface-variant">Cambiar a:</strong>
                        <select
                          className="text-sm bg-surface-grey border border-outline-variant rounded px-2 py-1 outline-none focus:border-trust-blue"
                          value={showOrderDetails.estado}
                          onChange={(e) => {
                            handleUpdateStatus(showOrderDetails.id, e.target.value);
                            setShowOrderDetails(null);
                          }}
                          disabled={loading}
                        >
                          <option value={showOrderDetails.estado}>{getStatusText(showOrderDetails.estado)}</option>
                          {getStatusOptions(showOrderDetails.estado).map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <p><strong className="text-on-surface-variant">Método Pago:</strong> {showOrderDetails.metodoPago?.nombre || 'N/A'}</p>
                      
                      <div className="flex items-center gap-2">
                        <strong className="text-on-surface-variant">Estado Pago:</strong> 
                        <span className={`px-2 py-0.5 rounded text-sm font-medium uppercase ${showOrderDetails.estadoPago === 'completado' ? 'text-success bg-success/10' : 'text-mass-yellow bg-mass-yellow/10'}`}>
                          {showOrderDetails.estadoPago}
                        </span>
                      </div>
                      
                      <p><strong className="text-on-surface-variant">Total Artículos:</strong> {getItemsCount(showOrderDetails)}</p>
                      <p className="text-lg"><strong className="text-on-surface-variant">Total a Pagar:</strong> <span className="text-trust-blue font-bold">S/.{parseFloat(showOrderDetails.montoTotal).toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>

                {showOrderDetails.detallesPedidos && showOrderDetails.detallesPedidos.length > 0 && (
                  <div className="mt-8">
                    <h6 className="font-label-bold text-lg text-on-surface border-b pb-2 mb-4">Productos del Pedido</h6>
                    <div className="border border-surface-container-highest rounded-lg overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-surface-container-low text-on-surface-variant text-sm uppercase tracking-wider">
                          <tr>
                            <th className="p-3 font-semibold">Producto</th>
                            <th className="p-3 font-semibold text-center">Cant</th>
                            <th className="p-3 font-semibold text-right">P. Unitario</th>
                            <th className="p-3 font-semibold text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-highest">
                          {showOrderDetails.detallesPedidos.map((detalle, index) => (
                            <tr key={index} className="hover:bg-surface-container-lowest">
                              <td className="p-3">{detalle.producto?.nombre || 'N/A'}</td>
                              <td className="p-3 text-center">{detalle.cantidad}</td>
                              <td className="p-3 text-right">S/.{parseFloat(detalle.precio).toFixed(2)}</td>
                              <td className="p-3 text-right font-medium">S/.{(detalle.cantidad * parseFloat(detalle.precio)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOrderDetails(null)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handlePrintOrder(showOrderDetails)}
                  leadingIcon={<Printer size={18} />}
                >
                  Imprimir Pedido
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderReports;