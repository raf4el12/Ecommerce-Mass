import React from 'react';
import LegalPage from '../components/legal/LegalPage';

const Terminos = () => (
  <LegalPage
    title="Términos y Condiciones"
    lastUpdated="Enero 2026"
    intro="Estos Términos y Condiciones regulan el uso del sitio web y los servicios de Tiendas Mass (Compañía Hard Discount S.A.C). Al navegar o realizar compras, aceptas los presentes términos."
    sections={[
      {
        title: 'Objeto',
        paragraphs: [
          'El presente documento regula el acceso y uso de la plataforma de comercio electrónico de Tiendas Mass, así como la compra de productos ofrecidos a través de ella.',
        ],
      },
      {
        title: 'Registro y cuenta',
        paragraphs: [
          'Para realizar compras puedes ser requerido a crear una cuenta proporcionando datos veraces y actualizados. Eres responsable de la confidencialidad de tus credenciales y de toda actividad realizada bajo tu cuenta.',
        ],
      },
      {
        title: 'Precios y disponibilidad',
        paragraphs: [
          'Los precios mostrados incluyen los impuestos de ley y están expresados en Soles (S/). La disponibilidad de productos puede variar y nos reservamos el derecho de modificar precios y stock sin previo aviso.',
        ],
      },
      {
        title: 'Pagos',
        paragraphs: [
          'Aceptamos los medios de pago indicados durante el proceso de compra. Las transacciones son procesadas por proveedores de pago autorizados bajo estándares de seguridad vigentes.',
        ],
      },
      {
        title: 'Entrega y recojo',
        paragraphs: [
          'Ofrecemos entrega a domicilio y recojo en tienda según disponibilidad por zona. Los plazos de entrega son referenciales y pueden verse afectados por factores externos.',
        ],
      },
      {
        title: 'Cambios y devoluciones',
        paragraphs: [
          'Las solicitudes de cambio o devolución se rigen por nuestra política vigente y la normativa de protección al consumidor. Para más detalles, comunícate con Servicio al Cliente.',
        ],
      },
      {
        title: 'Propiedad intelectual',
        paragraphs: [
          'Todo el contenido del sitio (marcas, logotipos, textos e imágenes) es propiedad de Tiendas Mass o de sus licenciantes y está protegido por la legislación aplicable.',
        ],
      },
      {
        title: 'Modificaciones',
        paragraphs: [
          'Podemos actualizar estos Términos en cualquier momento. La versión vigente será siempre la publicada en este sitio.',
        ],
      },
    ]}
  />
);

export default Terminos;
