export const mockProducts = [
  {
    id: 1,
    name: 'Coca Cola 350ml',
    description: 'Bebida gaseosa Coca Cola lata 350ml',
    price: 1.50,
    category: 'Bebidas',
    stock: 150,
    image: '/api/placeholder/100/100',
    active: true,
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    name: 'Pan Integral',
    description: 'Pan integral artesanal bolsa 500g',
    price: 2.80,
    category: 'Panadería',
    stock: 45,
    image: '/api/placeholder/100/100',
    active: true,
    createdAt: '2024-01-20'
  },
  {
    id: 3,
    name: 'Leche Entera 1L',
    description: 'Leche entera UHT 1 litro',
    price: 3.20,
    category: 'Lácteos',
    stock: 80,
    image: '/api/placeholder/100/100',
    active: true,
    createdAt: '2024-01-18'
  },
  // ... los demás productos igual
];

export const mockCategories = [
  { id: 1, name: 'Bebidas', description: 'Bebidas gaseosas, jugos y agua', active: true, productsCount: 15 },
  { id: 2, name: 'Lácteos', description: 'Leche, quesos, yogurt y derivados', active: true, productsCount: 12 },
  { id: 3, name: 'Panadería', description: 'Pan, pasteles y productos de panadería', active: true, productsCount: 8 },
  { id: 4, name: 'Carnes', description: 'Carnes frescas y embutidos', active: true, productsCount: 20 },
  { id: 5, name: 'Higiene', description: 'Productos de higiene personal y del hogar', active: true, productsCount: 25 },
  { id: 6, name: 'Snacks', description: 'Botanas, galletas y dulces', active: true, productsCount: 18 },
  { id: 7, name: 'Limpieza', description: 'Productos de limpieza del hogar', active: true, productsCount: 14 },
  { id: 8, name: 'Conservas', description: 'Alimentos enlatados y conservas', active: true, productsCount: 22 }
];

export const mockUsers = [
  {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@mass.com',
    role: 'Administrador',
    active: true,
    lastLogin: '2024-02-01 10:30:00',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    name: 'María García',
    email: 'maria@mass.com',
    role: 'Vendedor',
    active: true,
    lastLogin: '2024-02-01 09:15:00',
    createdAt: '2024-01-18'
  },
  // ...
];

export const mockOrders = [
  {
    id: 1,
    orderId: 'ORD-001',
    customer: 'Carlos López',
    total: 45.80,
    status: 'Completado',
    items: 5,
    date: '2024-02-01',
    paymentMethod: 'Tarjeta'
  },
  {
    id: 2,
    orderId: 'ORD-002',
    customer: 'Ana Martínez',
    total: 120.50,
    status: 'En proceso',
    items: 8,
    date: '2024-02-01',
    paymentMethod: 'Efectivo'
  },
  // ...
];

export const mockOrderStatuses = [
  { id: 1, name: 'Pendiente', description: 'Pedido recibido, esperando procesamiento', color: '#6c757d', active: true, order: 1 },
  { id: 2, name: 'En proceso', description: 'Pedido siendo preparado', color: '#ffc107', active: true, order: 2 },
  { id: 3, name: 'Listo', description: 'Pedido listo para entrega', color: '#17a2b8', active: true, order: 3 },
  { id: 4, name: 'Completado', description: 'Pedido entregado exitosamente', color: '#28a745', active: true, order: 4 },
  { id: 5, name: 'Cancelado', description: 'Pedido cancelado por cliente o sistema', color: '#dc3545', active: true, order: 5 }
];

export const mockPaymentMethods = [
  { id: 1, name: 'Efectivo', description: 'Pago en efectivo al momento de la entrega', active: true, commission: 0 },
  { id: 2, name: 'Tarjeta de Débito', description: 'Pago con tarjeta de débito', active: true, commission: 2.5 },
  { id: 3, name: 'Tarjeta de Crédito', description: 'Pago con tarjeta de crédito', active: true, commission: 3.5 },
  { id: 4, name: 'Transferencia Bancaria', description: 'Transferencia bancaria directa', active: true, commission: 1.0 },
  { id: 5, name: 'Pago Móvil', description: 'Pago a través de aplicaciones móviles', active: true, commission: 2.0 }
];
