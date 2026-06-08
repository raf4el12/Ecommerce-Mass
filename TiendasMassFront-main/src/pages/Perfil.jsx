import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, CreditCard, LogOut, Menu, X } from 'lucide-react';

import Profile from '../components/perfil/profile';
import Orders from '../components/perfil/orders';
import Addresses from '../components/perfil/direccion';
import Payments from '../components/perfil/metodopago';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/userContext';
import '../styles/perfil.css';
import logos from '../assets/logo.png';

const API_URL = "http://localhost:5001";

const menuItems = [
  { id: 'profile', label: 'Mi Perfil', icon: User },
  { id: 'orders', label: 'Mis Pedidos', icon: Package },
  { id: 'addresses', label: 'Direcciones', icon: MapPin },
  { id: 'payments', label: 'Métodos de Pago', icon: CreditCard },
];


const UserProfile = () => {


  const [activeSection, setActiveSection] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const { usuario, logout } = useUsuario(); // esta línea debe ir antes

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };


  useEffect(() => {
    const fetchUserData = async () => {
      if (!usuario?.id) return;

      try {
        const response = await fetch(`${API_URL}/api/usuarios/${usuario.id}`);
        const data = await response.json();

        // Asumimos que la respuesta ya tiene los nombres de la entidad Usuario
        setUserData({
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          ciudad: data.ciudad,
          direccion: data.direccion,
          codigoPostal: data.codigoPostal,
          rol: data.rol, // ✅ AÑADIDO AQUÍ
          birthDate: '15/03/1990', // temporal
        });

      } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
      }
    };

    fetchUserData();
  }, [usuario]);

  // Datos de prueba para otras secciones (puedes conectar con backend más adelante)
  const addresses = [
    { id: 1, type: 'Casa', street: 'Calle Mayor 123', city: 'Lima', zipCode: '28001', country: 'Peru', isDefault: true },
    { id: 2, type: 'Trabajo', street: 'Av. de la Castellana 456', city: 'Lima', zipCode: '28046', country: 'Peru', isDefault: false },
  ];

  const paymentMethods = [
    { id: 1, type: 'Visa', last4: '1234', expiry: '12/26', isDefault: true },
    { id: 2, type: 'Mastercard', last4: '5678', expiry: '08/27', isDefault: false },
  ];

  const orders = [
    { id: '#12345', date: '20 May, 2024', status: 'Entregado', total: '€89.99', items: 3 },
    { id: '#12344', date: '15 May, 2024', status: 'En camino', total: '€156.50', items: 2 },
    { id: '#12343', date: '8 May, 2024', status: 'Procesando', total: '€45.00', items: 1 },
  ];

  const renderSection = () => {
    if (!userData) return <p style={{ padding: '2rem' }}>Cargando perfil...</p>;

    switch (activeSection) {
      case 'profile':
        return <Profile userData={userData} setUserData={setUserData} />;
      case 'orders':
        return <Orders orders={orders} />;
      case 'addresses':
        return <Addresses addresses={addresses} />;
      case 'payments':
        return <Payments paymentMethods={paymentMethods} />;
      default:
        return <Profile userData={userData} setUserData={setUserData} />;
    }
  };

  const handleMenuItemClick = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="user-profile">
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="profile-container">
        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="user-info">
            <div className="user-details">
              <div className="user-name">{userData?.nombre}</div>
              <div className="user-email">{userData?.email}</div>
            </div>
          </div>

          <nav className="navigation">
            <ul className="menu-list">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <li key={id} className="menu-item">
                  <button
                    className={`menu-link ${activeSection === id ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(id)}
                  >
                    <Icon size={20} className="menu-icon" />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <button className="logout-link" type="button" onClick={handleLogout}>
              <LogOut size={20} className="menu-icon" />
              <span>Cerrar Sesión</span>
            </button>

            <button className="logout-link inicio" type="button" onClick={() => (window.location.href = '/')}>
              <User size={20} className="menu-icon" />
              <span>Inicio</span>
            </button>
          </div>
        </aside>

        {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

        <main className="main-content">
          <div className="container-content">{renderSection()}</div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
