// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import Catalogo from './pages/Catalogo'; // Cambiado de Categorias
import CheckoutPage from './pages/CheckoutPage';
import Contacto from './pages/Contacto';
import Tiendas from './pages/Tiendas';
import TrabajaConNosotros from './pages/TrabajaConNosotros';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import LibroReclamaciones from './pages/LibroReclamaciones';
import { CarritoProvider } from './context/carContext';
import { UsuarioProvider } from './context/userContext';
import ResultadosBusqueda from './pages/ResultadosBusqueda';
import UserProfile from './pages/Perfil';
import DetalleProducto from './components/productos/detalleproductomodal';
import Admin from './pages/Admin';
import Dashboard from './admin/components/Dashboard';
import GestionCategorias from './admin/components/GestionCategorias';
import GestionSubcategorias from './admin/components/GestionSubcategorias';
import GestionEstados from './admin/components/GestionEstados';
import GestionMetodoPago from './admin/components/GestionMetodoPago';
import GestionProducto from './admin/components/GestionProducto';
import GestionUsuarios from './admin/components/GestionUsuarios';
import ReportesPedidos from './admin/components/ReportesPedidos';
import CrearAdmin from './admin/components/CrearAdmin';
import AdminRoute from './components/AdminRoute';
import GestionTienda from './admin/components/GestionTienda';
import GestionMasterTable from './admin/components/GestionMasterTable'; 
import GestionPermisos from './admin/components/GestionPermisos'; 
import AdminLogin from './admin/components/AdminLogin'; 

import { initMercadoPago } from '@mercadopago/sdk-react';

import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutFailure from './pages/CheckoutFailure';
import CheckoutPending from './pages/CheckoutPending';

import SkipLinks from './components/SkipLinks';
import PublicLayout from './components/layout/PublicLayout';

function App() {
  useEffect(() => {
    initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-PE' });
  }, []);

  return (
    <UsuarioProvider>
      <CarritoProvider>
        <SkipLinks />
        <Router>
          <Routes>
            {/* ==================== */}
            {/* 1. RUTAS PÚBLICAS Y DE USUARIO */}
            {/* ==================== */}
            
            {/* Landing (header/footer propios) */}
            <Route path="/" element={<Home />} />

            <Route element={<PublicLayout />}>
              {/* Catálogo y Búsqueda */}
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/buscar" element={<ResultadosBusqueda />} />
              <Route path="/producto/:id" element={<DetalleProducto />} />
              
              {/* Información de la tienda */}
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/tiendas" element={<Tiendas />} />
              <Route path="/trabaja-con-nosotros" element={<TrabajaConNosotros />} />

              {/* Legales */}
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/reclamaciones" element={<LibroReclamaciones />} />

              {/* Autenticación */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Perfil del Cliente */}
              <Route path="/perfil" element={<UserProfile />} />
              
              {/* Flujo de Checkout y Mercado Pago */}
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/failure" element={<CheckoutFailure />} />
              <Route path="/checkout/pending" element={<CheckoutPending />} />
            </Route>

            {/* ==================== */}
            {/* 2. RUTAS DE ADMIN    */}
            {/* ==================== */}
            {/* Login exclusivo para Administradores */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="categorias" element={<GestionCategorias />} />
              <Route path="subcategorias" element={<GestionSubcategorias />} />
              <Route path="estados" element={<GestionEstados />} />
              <Route path="metodos-pago" element={<GestionMetodoPago />} />
              <Route path="productos" element={<GestionProducto />} />
              <Route path="usuarios" element={<GestionUsuarios />} />
              <Route path="reportes" element={<ReportesPedidos />} />
              <Route path="crear-admin" element={<CrearAdmin />} />
              <Route path="tiendas" element={<GestionTienda />} />
              <Route path="tabla-maestra" element={<GestionMasterTable />} /> {/* ✅ NUEVO */}
              {/* === Ruta para gestionar permisos por rol - Asigna módulos y acciones a roles === */}
              <Route path="permisos" element={<GestionPermisos />} /> {/* ✅ NUEVO PARA PERMISOS */}
            </Route>

            {/* ==================== */}
            {/* 4. RUTA NO ENCONTRADA*/}
            {/* ==================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CarritoProvider>
    </UsuarioProvider>
  );
}

export default App;
