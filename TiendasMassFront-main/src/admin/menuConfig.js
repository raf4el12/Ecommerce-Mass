import {
  Home,
  Package,
  Folder,
  Users,
  ShoppingCart,
  Settings,
  CreditCard,
  UserPlus,
  Store,
  Database,
  Lock,
} from 'lucide-react';

export const adminMenuItems = [
  { to: '/admin/dashboard',     label: 'Dashboard',       icon: Home,        modulo: 'DASHBOARD' },
  { to: '/admin/productos',     label: 'Productos',       icon: Package,     modulo: 'PRODUCTOS' },
  { to: '/admin/categorias',    label: 'Categorías',      icon: Folder,      modulo: 'CATEGORIAS' },
  { to: '/admin/subcategorias', label: 'Subcategorías',   icon: Folder,      modulo: 'SUBCATEGORIAS' },
  { to: '/admin/usuarios',      label: 'Usuarios',        icon: Users,       modulo: 'USUARIOS' },
  { to: '/admin/reportes',      label: 'Pedidos',         icon: ShoppingCart, modulo: 'PEDIDOS' },
  { to: '/admin/estados',       label: 'Estados',         icon: Settings,    modulo: 'ESTADOS' },
  { to: '/admin/metodos-pago',  label: 'Métodos de Pago', icon: CreditCard,  modulo: 'METODO_PAGO' },
  { to: '/admin/crear-admin',   label: 'Crear Admin',     icon: UserPlus,    modulo: 'USUARIOS' },
  { to: '/admin/tiendas',       label: 'Tiendas',         icon: Store,       modulo: 'TIENDAS' },
  { to: '/admin/tabla-maestra', label: 'Tabla Maestra',   icon: Database,    modulo: 'MASTER_TABLE' },
  { to: '/admin/permisos',      label: 'Permisos',        icon: Lock,        modulo: 'MASTER_TABLE' },
];

export const BOTTOM_NAV_MODULES = ['DASHBOARD', 'PRODUCTOS', 'PEDIDOS'];

export function getAdminInfo() {
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      return {
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol?.nombre,
      };
    }
  } catch (error) {
    console.error('Error al obtener datos de admin:', error);
  }
  return null;
}
