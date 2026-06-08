import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import { adminMenuItems, getAdminInfo } from '../menuConfig';

const Header = ({ onOpenMobile = () => {} }) => {
  const location = useLocation();
  const adminInfo = getAdminInfo();

  const currentItem = adminMenuItems.find((m) => m.to === location.pathname);
  const title = currentItem?.label || 'Panel de Control';

  const avatarLetter = (adminInfo?.nombre || 'A').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant shadow-sm w-full transition-all">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-[72px]">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-trust-blue p-2 -ml-2 hover:bg-surface-container-high rounded-full transition-colors"
            onClick={onOpenMobile}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md bg-gradient-to-r from-trust-blue to-trust-blue/70 bg-clip-text text-transparent truncate tracking-tight">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-5">
          <button
            className="relative p-2 text-on-surface-variant hover:text-trust-blue hover:bg-surface-container-low rounded-full transition-all hover:shadow-sm"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 border-2 border-surface bg-sale-red rounded-full" />
          </button>
          
          <div className="h-8 w-px bg-outline-variant/50 hidden md:block"></div>

          <button className="flex items-center gap-3 hover:bg-surface-container-lowest p-1 pr-3 rounded-full transition-all border border-transparent hover:border-outline-variant/30 hover:shadow-sm group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-trust-blue to-trust-blue/80 text-white flex items-center justify-center font-label-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
              {avatarLetter}
            </div>
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <div className="flex flex-col items-start">
                <span className="font-label-bold text-label-bold text-on-surface truncate max-w-[140px] leading-tight">
                  {adminInfo?.nombre || 'Admin'}
                </span>
                {adminInfo?.rol && (
                  <span className="text-[11px] font-medium text-on-surface-variant truncate max-w-[140px] leading-tight uppercase tracking-wider">
                    {adminInfo.rol}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-on-surface-variant group-hover:text-trust-blue transition-colors ml-1" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
