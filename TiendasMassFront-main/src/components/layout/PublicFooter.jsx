import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter = () => {
  return (
    <footer className="bg-surface-container-highest border-t border-outline-variant w-full pt-section-gap pb-12 px-margin-mobile md:px-margin-desktop mt-auto">
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-gutter mt-section-gap">
        <div className="flex flex-col gap-4">
          <span className="font-headline-md text-headline-md font-extrabold text-trust-blue">Tiendas Mass</span>
          <p className="font-body-md text-body-md text-on-surface-variant">© 2026 Tiendas Mass. Todos los derechos reservados. El ahorro de tu barrio.</p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-bold text-label-bold text-on-surface mb-2">Enlaces</h4>
          <Link className="text-on-surface-variant font-body-md hover:text-trust-blue transition-all duration-200" to="/contacto">Servicio al Cliente</Link>
          <a className="text-on-surface-variant font-body-md hover:text-trust-blue transition-all duration-200" href="#">Libro de Reclamaciones</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-bold text-label-bold text-on-surface mb-2 opacity-0 hidden md:block">Espacio</h4>
          <a className="text-on-surface-variant font-body-md hover:text-trust-blue transition-all duration-200" href="#">Términos y Condiciones</a>
          <a className="text-on-surface-variant font-body-md hover:text-trust-blue transition-all duration-200" href="#">Política de Privacidad</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-bold text-label-bold text-on-surface mb-2 opacity-0 hidden md:block">Espacio</h4>
          <a className="text-on-surface-variant font-body-md hover:text-trust-blue transition-all duration-200" href="/#trabaja">Trabaja con Nosotros</a>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
