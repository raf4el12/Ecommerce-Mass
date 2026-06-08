import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, X, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import { useUsuario } from '../../context/userContext';
import { adminMenuItems, BOTTOM_NAV_MODULES, getAdminInfo } from '../menuConfig';

const API_URL = import.meta.env.VITE_API_URL;

const Sidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useUsuario();
  const [modulosPermitidos, setModulosPermitidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const token = getToken();
        if (!token) {
          setCargando(false);
          return;
        }
        const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          console.error('Error al obtener permisos:', response.status);
          setCargando(false);
          return;
        }
        const data = await response.json();
        setModulosPermitidos(data.modulos || []);
      } catch (error) {
        console.error('Error al cargar permisos:', error);
      } finally {
        setCargando(false);
      }
    };
    fetchModulos();
  }, [getToken]);

  const menuItems = cargando
    ? []
    : adminMenuItems.filter((item) => modulosPermitidos.includes(item.modulo));

  const bottomNavItems = menuItems
    .filter((item) => BOTTOM_NAV_MODULES.includes(item.modulo))
    .slice(0, 4);

  const adminInfo = getAdminInfo();

  const handleLogout = () => {
    Swal.fire({
      title: '¿Desea Salir del panel de administrativo?',
      text: '¿Estás seguro de que quieres salir del panel administrativo?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has salido del panel administrativo',
          timer: 2000,
          showConfirmButton: false,
        });
        navigate('/');
      }
    });
  };

  const handleNavClick = () => {
    if (mobileOpen) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (desktop fixed, mobile drawer) */}
      <nav
        className={`
          fixed left-0 top-0 h-screen w-64 z-50 flex flex-col py-4
          bg-surface-container-low border-r border-outline-variant
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="Menú principal"
      >
        {/* Brand */}
        <div className="px-4 mb-6 flex items-start justify-between">
          <div className="min-h-12 w-full flex flex-col justify-center">
            <div className="w-full h-24 mb-4 rounded-xl overflow-hidden relative shadow-md flex items-center justify-center">
              <img 
                src="/images/login-bg.png" 
                alt="Fondo Tiendas Mass" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-trust-blue/50 mix-blend-multiply"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-trust-blue/80 to-transparent"></div>
              <h1 className="relative z-10 font-headline-lg text-2xl text-white font-bold tracking-tight drop-shadow-lg px-2 text-center">
                Tiendas Mass
              </h1>
            </div>
            {adminInfo ? (
              <>
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {adminInfo.nombre || 'Admin'}
                </p>
                {adminInfo.rol && (
                  <p className="font-body-md text-sm text-on-surface-variant truncate">
                    {adminInfo.rol}
                  </p>
                )}
              </>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Panel administrativo
              </p>
            )}
          </div>
          <button
            className="md:hidden text-on-surface-variant hover:bg-surface-container-high rounded-full p-1 -mr-1"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto">
          {cargando ? (
            <p className="text-center font-body-md text-body-md text-on-surface-variant py-4">
              Cargando permisos…
            </p>
          ) : menuItems.length === 0 ? (
            <p className="text-center font-body-md text-body-md text-on-surface-variant py-4">
              Sin acceso a módulos
            </p>
          ) : (
            menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`
                    flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                    transition-all duration-200 ease-in-out
                    ${
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }
                  `}
                >
                  <IconComponent size={20} className="flex-shrink-0" />
                  <span className="font-label-bold text-label-bold">
                    {item.label}
                  </span>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 mt-4 space-y-2 pt-4 border-t border-outline-variant/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="font-label-bold text-label-bold">
              Cerrar Sesión
            </span>
          </button>
          <button
            onClick={() => {
              handleNavClick();
              navigate('/');
            }}
            className="w-full flex items-center justify-center gap-2 bg-trust-blue text-on-primary rounded-full py-3 font-label-bold text-label-bold hover:bg-secondary transition-all shadow-[0_4px_16px_rgba(0,51,160,0.2)]"
          >
            <ExternalLink size={18} />
            Salir del panel
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      {bottomNavItems.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
          aria-label="Navegación rápida"
        >
          <div className="flex justify-around items-center px-4 py-2">
            {bottomNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex flex-col items-center justify-center px-4 py-2 rounded-full
                    transition-colors min-w-[64px]
                    ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant'
                    }
                  `}
                >
                  <IconComponent size={20} />
                  <span className="font-label-bold text-[10px] mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
