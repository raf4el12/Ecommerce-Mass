import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Bell,
  Settings,
  ArrowRight,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useUsuario } from '../../context/userContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const API_URL = 'http://localhost:5001';

const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useUsuario();
  const [dashboardData, setDashboardData] = useState({
    estadisticas: {
      totalProductos: 0,
      totalUsuarios: 0,
      totalPedidos: 0,
      pedidosHoy: 0,
      ventasTotales: 0,
      ventasMes: 0,
    },
    cambios: {
      productos: '+0%',
      usuarios: '+0%',
      pedidosHoy: '+0%',
      ventasMes: '+0%',
    },
    estadisticasPorEstado: {},
    topProductos: [],
    pedidosRecientes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarPermisoDashboard();
  }, [getToken]);

  const verificarPermisoDashboard = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/admin/productos');
        return;
      }

      const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        navigate('/admin/productos');
        return;
      }

      const data = await response.json();

      if (!data.modulos || !data.modulos.includes('DASHBOARD')) {
        if (data.modulos && data.modulos.length > 0) {
          const moduloRuta = {
            PRODUCTOS: '/admin/productos',
            CATEGORIAS: '/admin/categorias',
            SUBCATEGORIAS: '/admin/subcategorias',
            USUARIOS: '/admin/usuarios',
            PEDIDOS: '/admin/reportes',
            ESTADOS: '/admin/estados',
            METODO_PAGO: '/admin/metodos-pago',
            TIENDAS: '/admin/tiendas',
            MASTER_TABLE: '/admin/tabla-maestra',
          };
          const primeraRuta = moduloRuta[data.modulos[0]] || '/admin/productos';
          navigate(primeraRuta, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
        return;
      }

      loadDashboardData();
    } catch (error) {
      console.error('Error al verificar permiso:', error);
      navigate('/admin/productos');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/estadisticas`);
      if (!response.ok) throw new Error('Error al cargar datos del dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos del dashboard',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSoles = (n) =>
    `S/.${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const statusStyles = {
    entregado: 'bg-secondary-fixed text-on-secondary-container',
    enviado: 'bg-secondary-container text-on-secondary',
    confirmado: 'bg-primary-fixed text-on-primary-fixed',
    pendiente: 'bg-surface-container-high text-on-surface-variant',
    cancelado: 'bg-error-container text-on-error-container',
  };

  const statusText = {
    entregado: 'Entregado',
    enviado: 'Enviado',
    confirmado: 'Confirmado',
    pendiente: 'Pendiente',
    cancelado: 'Cancelado',
  };

  const ventasMes = dashboardData.estadisticas.ventasMes || 0;
  const cambioVentas = dashboardData.cambios.ventasMes || '+0%';
  const cambioVentasPositive = cambioVentas.startsWith('+');

  const smallMetrics = [
    {
      title: 'Pedidos Hoy',
      value: dashboardData.estadisticas.pedidosHoy.toLocaleString(),
      change: dashboardData.cambios.pedidosHoy,
      icon: ShoppingCart,
      tone: 'blue',
    },
    {
      title: 'Total Productos',
      value: dashboardData.estadisticas.totalProductos.toLocaleString(),
      change: dashboardData.cambios.productos,
      icon: Package,
      tone: 'blue',
    },
    {
      title: 'Usuarios Activos',
      value: dashboardData.estadisticas.totalUsuarios.toLocaleString(),
      change: dashboardData.cambios.usuarios,
      icon: Users,
      tone: 'blue',
    },
  ];

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop bg-background min-h-screen">
        <h1 className="font-headline-xl text-headline-xl text-trust-blue">Dashboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Resumen general del sistema
        </p>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-trust-blue border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
            Cargando datos del dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop bg-background min-h-screen">
      {/* Header */}
      <header className="hidden md:flex justify-between items-center mb-section-gap">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-trust-blue">Dashboard Overview</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Bienvenido de nuevo. Aquí está el resumen de hoy.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-highest p-3 rounded-full hover:bg-tertiary-container transition-colors shadow-sm">
            <Bell className="text-trust-blue" size={20} />
          </button>
          <button className="bg-surface-container-highest p-3 rounded-full hover:bg-tertiary-container transition-colors shadow-sm">
            <Settings className="text-trust-blue" size={20} />
          </button>
        </div>
      </header>

      <div className="md:hidden mb-8">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-trust-blue">
          Dashboard Overview
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Resumen general del sistema
        </p>
      </div>

      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-section-gap">
        {/* Hero metric: Ventas del Mes */}
        <Card className="md:col-span-8 relative overflow-hidden flex flex-col justify-between !p-0">
          <div className="p-8 relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Ventas del Mes
                </h3>
                <div className="font-price-display text-price-display text-trust-blue flex items-baseline gap-2 flex-wrap">
                  {formatSoles(ventasMes)}
                  <span
                    className={`text-[14px] leading-[20px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
                      cambioVentasPositive
                        ? 'bg-mass-yellow text-on-primary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {cambioVentasPositive ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    {cambioVentas}
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-full">
                <DollarSign className="text-trust-blue" size={32} />
              </div>
            </div>
            <div className="mt-8 h-24 w-full bg-gradient-to-t from-trust-blue/10 to-transparent border-b-2 border-trust-blue relative">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <path
                  d="M0 80 Q 20 60, 40 70 T 80 40 T 100 20"
                  fill="none"
                  stroke="#0033A0"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </Card>

        {/* Smaller Metrics Stack */}
        <div className="md:col-span-4 flex flex-col gap-gutter">
          {smallMetrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <Card
                key={i}
                className="flex-1 flex items-center justify-between transition-transform hover:-translate-y-1 duration-200 !p-6"
              >
                <div>
                  <h3 className="font-label-bold text-label-bold text-on-surface-variant mb-1">
                    {m.title}
                  </h3>
                  <p className="font-headline-md text-headline-md text-trust-blue">{m.value}</p>
                  <p className="font-body-md text-[12px] text-on-surface-variant mt-1">
                    {m.change} vs. mes pasado
                  </p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-full">
                  <Icon className="text-trust-blue" size={22} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main Content: Orders & Top Products */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-20">
        {/* Pedidos Recientes */}
        <Card className="lg:col-span-8 !p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="font-headline-md text-headline-md text-trust-blue">Pedidos Recientes</h2>
            <button
              onClick={() => navigate('/admin/reportes')}
              className="font-label-bold text-label-bold text-trust-blue flex items-center gap-1 hover:underline"
            >
              Ver todos <ArrowRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-grey font-label-bold text-label-bold text-on-surface-variant border-b border-outline-variant">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Hora</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                {dashboardData.pedidosRecientes.length > 0 ? (
                  dashboardData.pedidosRecientes.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="p-4">
                        <strong className="text-trust-blue">#{order.id}</strong>
                      </td>
                      <td className="p-4">{order.cliente}</td>
                      <td className="p-4 font-semibold">{formatSoles(order.total)}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                            statusStyles[order.estado] ||
                            'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {statusText[order.estado] || order.estado}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{formatDate(order.fecha)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-on-surface-variant font-body-md"
                    >
                      <ClipboardList
                        className="mx-auto mb-2 text-outline-variant"
                        size={32}
                      />
                      No hay pedidos recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Productos */}
        <Card className="lg:col-span-4 !p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant bg-surface-container-low">
            <h2 className="font-headline-md text-headline-md text-trust-blue">Top Productos</h2>
          </div>
          <div className="p-2 flex-1">
            {dashboardData.topProductos.length > 0 ? (
              dashboardData.topProductos.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <div className="w-10 h-10 bg-tertiary-container rounded-md flex items-center justify-center flex-shrink-0">
                    <Package className="text-on-surface-variant" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-on-surface truncate">{product.nombre}</div>
                    <small className="font-body-md text-[12px] text-on-surface-variant">
                      {product.vendidos} vendidos
                    </small>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <strong className="text-trust-blue font-semibold">
                      {formatSoles(product.ingresos)}
                    </strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-on-surface-variant py-12 px-4">
                <Package className="mx-auto mb-2 text-outline-variant" size={32} />
                <p className="font-body-md text-body-md">No hay productos vendidos aún</p>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
