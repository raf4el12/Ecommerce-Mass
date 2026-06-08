import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUsuario } from '../../context/userContext';
import { useCarrito } from '../../context/carContext';
import Carrito from '../car/Carrito';
import { Menu, Search, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import logo from '../../assets/logo.png';

const API_URL = "http://localhost:5001";

const PublicHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [esAdmin, setEsAdmin] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();
  const { usuario, logout, getToken } = useUsuario();
  const { carrito } = useCarrito();

  const isLoggedIn = Boolean(usuario);
  const nombreCompleto = String(usuario?.nombre || 'Usuario').trim();
  const nombreUsuario = nombreCompleto.split(/\s+/)[0] || 'Usuario';
  const totalItems = carrito.reduce((acc, producto) => acc + producto.cantidad, 0);

  useEffect(() => {
    if (usuario && getToken()) {
      verificarAccesoAdmin();
    }
  }, [usuario, getToken]);

  const verificarAccesoAdmin = async () => {
    try {
      const token = getToken();
      if (!token) {
        setEsAdmin(false);
        return;
      }
      const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEsAdmin(data.modulos && data.modulos.length > 0);
      } else {
        setEsAdmin(false);
      }
    } catch (error) {
      const esAdminPorNombre = usuario && (
        ["admin", "ADMIN", "Administrador", "administrador"].includes(usuario.rol?.nombre) ||
        usuario.rol?.id === 1
      );
      setEsAdmin(esAdminPorNombre);
    }
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSugerencias([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/products?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setSugerencias(data.slice(0, 5));
      } catch (err) {
        setSugerencias([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
      setMenuOpen(false);
      setSugerencias([]);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-surface surface-container-lowest border-b border-outline-variant shadow-sm w-full sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-20">
        
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="Tiendas Mass — Inicio" className="flex-shrink-0">
            <img src={logo} alt="Tiendas Mass" className="h-8 md:h-10 object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link className="text-trust-blue font-label-bold border-b-2 border-trust-blue pb-1 transition-transform duration-150 scale-95" to="/catalogo">Precios Mass</Link>
            <Link className="text-on-surface-variant font-body-md hover:text-trust-blue transition-colors duration-200" to="/tiendas">Nuestras Tiendas</Link>
            <a className="text-on-surface-variant font-body-md hover:text-trust-blue transition-colors duration-200" href="/#trabaja">Trabaja Conmigo</a>
            <a className="text-on-surface-variant font-body-md hover:text-trust-blue transition-colors duration-200" href="/contacto">Servicio al Cliente</a>
          </nav>
        </div>

        {/* Actions (Search, Cart, User) */}
        <div className="flex items-center gap-4">
          
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-trust-blue" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={28} />
          </button>

          {/* Search Bar Desktop */}
          <div className="hidden md:flex relative">
            <form onSubmit={handleSearchSubmit} className="relative w-64">
              <input 
                className="w-full bg-surface-grey border-2 border-transparent focus:border-trust-blue rounded-lg py-2 pl-4 pr-10 outline-none transition-colors font-body-md" 
                placeholder="Buscar productos..." 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-trust-blue cursor-pointer">
                <Search size={20} />
              </button>
            </form>

            {/* Suggestions Desktop */}
            {searchTerm && sugerencias.length > 0 && (
              <ul className="absolute top-12 left-0 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden z-50">
                {sugerencias.map((prod) => (
                  <li 
                    key={prod.id} 
                    className="px-4 py-2 hover:bg-surface-container-low cursor-pointer font-body-md text-on-surface"
                    onClick={() => {
                      navigate(`/producto/${prod.id}`);
                      setSearchTerm('');
                      setSugerencias([]);
                    }}
                  >
                    {prod.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart */}
          <div className="relative">
            <button 
              className="relative p-2 text-trust-blue hover:bg-surface-container-low rounded-full transition-colors"
              onClick={() => setMostrarCarrito(!mostrarCarrito)}
            >
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-sale-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            {mostrarCarrito && (
              <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest shadow-xl rounded-xl border border-outline-variant z-50 p-4">
                <Carrito onClose={() => setMostrarCarrito(false)} />
              </div>
            )}
          </div>

          {/* User Section Desktop */}
          <div className="hidden md:block relative">
            {!isLoggedIn ? (
              <Link to="/login" className="bg-trust-blue text-white font-label-bold rounded-full px-6 py-2 hover:bg-trust-blue-dark transition-colors shadow-level-1 flex items-center gap-2">
                <User size={18} />
                Iniciar Sesión
              </Link>
            ) : (
              <div className="relative">
                <button 
                  className="flex items-center gap-2 bg-surface-container-low text-trust-blue font-label-bold rounded-full px-4 py-2 hover:bg-surface-container-high transition-colors border border-outline-variant/30"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User size={18} />
                  Hola, {nombreUsuario}
                  <ChevronDown size={16} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-surface-container-lowest shadow-lg rounded-xl border border-outline-variant overflow-hidden z-50">
                    <ul className="flex flex-col text-body-md text-on-surface">
                      {esAdmin && (
                        <li>
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard size={18} className="text-trust-blue" /> Panel Admin
                          </Link>
                        </li>
                      )}
                      <li>
                        <Link to="/perfil" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <User size={18} className="text-trust-blue" /> Mi Perfil
                        </Link>
                      </li>
                      <li className="border-t border-outline-variant/30">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-error-container hover:text-error transition-colors text-left">
                          <LogOut size={18} className={esAdmin ? "" : "text-sale-red"} /> Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu & Search */}
      {menuOpen && (
        <div className="md:hidden px-margin-mobile pb-4 w-full border-t border-outline-variant bg-surface-container-lowest">
          <form onSubmit={handleSearchSubmit} className="relative w-full mt-4 mb-4">
            <input 
              className="w-full bg-surface-grey border-2 border-transparent focus:border-trust-blue rounded-lg py-3 pl-4 pr-10 outline-none transition-colors font-body-md" 
              placeholder="Buscar productos..." 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-3.5 text-trust-blue">
              <Search size={20} />
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-4 font-body-lg text-on-surface mb-6">
            <Link to="/catalogo" onClick={() => setMenuOpen(false)} className="border-b border-outline-variant/20 pb-2">Precios Mass</Link>
            <Link to="/tiendas" onClick={() => setMenuOpen(false)} className="border-b border-outline-variant/20 pb-2">Nuestras Tiendas</Link>
            <a href="/#trabaja" onClick={() => setMenuOpen(false)} className="border-b border-outline-variant/20 pb-2">Trabaja Conmigo</a>
            <a href="/contacto" onClick={() => setMenuOpen(false)} className="border-b border-outline-variant/20 pb-2">Servicio al Cliente</a>
          </nav>

          {/* Mobile User Actions */}
          <div className="flex flex-col gap-3">
            {!isLoggedIn ? (
              <Link to="/login" className="bg-trust-blue text-white font-label-bold text-center rounded-lg px-6 py-3 hover:bg-trust-blue-dark transition-colors" onClick={() => setMenuOpen(false)}>
                Iniciar Sesión
              </Link>
            ) : (
              <>
                <div className="font-label-bold text-trust-blue mb-2">Hola, {nombreUsuario}</div>
                {esAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 text-on-surface-variant hover:text-trust-blue" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard size={18} /> Panel Admin
                  </Link>
                )}
                <Link to="/perfil" className="flex items-center gap-2 text-on-surface-variant hover:text-trust-blue" onClick={() => setMenuOpen(false)}>
                  <User size={18} /> Mi Perfil
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sale-red mt-2">
                  <LogOut size={18} /> Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
