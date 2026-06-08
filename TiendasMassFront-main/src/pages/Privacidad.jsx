import React from 'react';
import LegalPage from '../components/legal/LegalPage';

const Privacidad = () => (
  <LegalPage
    title="Política de Privacidad"
    lastUpdated="Enero 2026"
    intro="En Tiendas Mass (Compañía Hard Discount S.A.C) protegemos tus datos personales conforme a la Ley N.º 29733, Ley de Protección de Datos Personales del Perú, y su reglamento."
    sections={[
      {
        title: 'Datos que recopilamos',
        paragraphs: [
          'Recopilamos datos que nos proporcionas al registrarte o comprar (nombre, documento, correo, teléfono, dirección) y datos de uso del sitio necesarios para brindar el servicio.',
        ],
      },
      {
        title: 'Finalidad del tratamiento',
        paragraphs: [
          'Usamos tus datos para procesar pedidos y pagos, gestionar entregas, brindar atención al cliente y, con tu consentimiento, enviarte comunicaciones comerciales.',
        ],
      },
      {
        title: 'Conservación',
        paragraphs: [
          'Conservamos tus datos durante el tiempo necesario para cumplir las finalidades descritas y las obligaciones legales aplicables.',
        ],
      },
      {
        title: 'Compartir información',
        paragraphs: [
          'Podemos compartir datos con proveedores que nos prestan servicios (pago, logística) bajo obligaciones de confidencialidad, y con autoridades cuando la ley lo exija.',
        ],
      },
      {
        title: 'Tus derechos (ARCO)',
        paragraphs: [
          'Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a servicioalcliente@tiendasmass.pe. Atenderemos tu solicitud en los plazos de ley.',
        ],
      },
      {
        title: 'Seguridad',
        paragraphs: [
          'Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra acceso no autorizado, pérdida o alteración.',
        ],
      },
      {
        title: 'Cookies',
        paragraphs: [
          'Utilizamos cookies y tecnologías similares para mejorar tu experiencia. Puedes configurar tu navegador para gestionarlas.',
        ],
      },
    ]}
  />
);

export default Privacidad;
