import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import logo from '../assets/logo.png';

const TikTokIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// Imágenes reales de Tiendas Mass descargadas a /public/images (estables, no caducan).
const HERO_BANNER = '/images/hero.jpg';
const BENTO_MAIN = '/images/bento-canasta.jpg';
const BENTO_DAIRY = '/images/bento-lacteos.jpg';
const BENTO_DELI = '/images/bento-embutidos.jpg';
const STORE_MAP = '/images/tienda-familia.png';
const JOB_BG = '/images/trabajo.webp';

const FilledIcon = ({ name, className = '' }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: "'FILL' 1" }}
    aria-hidden="true"
  >
    {name}
  </span>
);

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
    {name}
  </span>
);

const Home = () => {
  return (
    <div className="bg-background text-on-background font-body-md antialiased">
      <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-20">
          <Link to="/" className="flex-shrink-0" aria-label="Tiendas Mass — Inicio">
            <img alt="Tiendas Mass" className="h-8 md:h-10 object-contain" src={logo} />
          </Link>
          <nav className="hidden md:flex items-center gap-gutter" aria-label="Principal">
            <Link to="/catalogo" className="text-on-surface-variant font-body-md hover:text-trust-blue transition-colors duration-200">
              Precios Mass
            </Link>
            <a href="#ubicame" className="text-on-surface-variant font-body-md hover:text-trust-blue transition-colors duration-200">
              Ubícame
            </a>
            <a href="#trabaja" className="text-on-surface-variant font-body-md hover:text-trust-blue transition-colors duration-200">
              Trabaja Conmigo
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/contacto" className="font-label-bold text-label-bold text-trust-blue hover:text-trust-blue-dark transition-colors duration-200">
              Alquila tu Local
            </Link>
            <a
              href="#ubicame"
              className="bg-trust-blue text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-full hover:bg-trust-blue-dark transition-colors duration-200 inline-flex items-center gap-2 h-12 shadow-[0_4px_16px_rgba(0,51,160,0.12)]"
            >
              Ubícame
            </a>
          </div>
          <button className="md:hidden text-trust-blue" aria-label="Abrir menú">
            <Icon name="menu" className="text-3xl" />
          </button>
        </div>
      </header>

      <main>
        <section className="relative w-full overflow-hidden bg-mass-yellow min-h-[500px] flex items-center pt-8 pb-12 md:py-0">
          <div className="absolute inset-0 z-0 hidden md:block">
            <img
              alt=""
              className="w-full h-full object-cover opacity-90 mix-blend-multiply"
              src={HERO_BANNER}
            />
          </div>
          <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            <div className="md:col-span-6 bg-surface-container-lowest/90 backdrop-blur-sm p-6 md:p-10 rounded-xl shadow-[0_8px_32px_rgba(0,51,160,0.08)] border border-outline-variant/30">
              <h1 className="font-headline-xl text-headline-xl text-trust-blue mb-4">
                ¡LOS MEJORES PRECIOS DEL BARRIO!
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                Caser@, a mi nadie me gana, yo tengo siempre los <strong>mejores precios</strong>, y además, estoy{' '}
                <strong>cerca a tu hogar</strong>.
              </p>
              <Link
                to="/catalogo"
                className="bg-trust-blue text-on-primary font-label-bold text-label-bold py-4 px-8 rounded-full hover:bg-trust-blue-dark transition-all duration-200 inline-flex items-center justify-center gap-2 h-12 w-full md:w-auto shadow-[0_4px_16px_rgba(0,51,160,0.2)] hover:shadow-[0_6px_20px_rgba(0,51,160,0.3)]"
              >
                QUIERO VER PRECIOS
              </Link>
            </div>
            <div className="md:col-span-6 mt-8 md:mt-0 md:hidden">
              <img alt="" className="w-full h-auto rounded-xl shadow-md" src={HERO_BANNER} />
            </div>
          </div>
        </section>

        <section className="py-section-gap w-full bg-surface-container-low">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-12">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue mb-4">
                PRECIOS MASS AHORRO
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Encuentra los productos de siempre, con la calidad que buscas y al precio que mereces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-[300px]">
              <div className="md:col-span-8 md:row-span-2 relative rounded-2xl overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-surface-container-lowest">
                <img
                  alt="Canasta básica"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={BENTO_MAIN}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className="inline-block bg-mass-yellow text-trust-blue font-label-bold text-label-bold px-3 py-1 rounded-full mb-3 shadow-sm">
                    NUEVO AHORRO
                  </span>
                  <h3 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-primary mb-2">
                    Canasta Básica
                  </h3>
                  <p className="font-body-md text-body-md text-on-primary/90 mb-4">
                    Todo lo que necesitas para tu hogar.
                  </p>
                  <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 text-mass-yellow font-label-bold text-label-bold hover:text-on-primary transition-colors"
                  >
                    Ver productos <Icon name="arrow_forward" className="text-sm" />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-4 relative rounded-2xl overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-surface-container-lowest">
                <img
                  alt="Lácteos"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={BENTO_DAIRY}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-trust-blue/90 via-trust-blue/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="font-headline-md text-headline-md text-on-primary mb-1">Lácteos</h3>
                  <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 text-mass-yellow font-label-bold text-label-bold hover:text-on-primary transition-colors"
                  >
                    Ver precios <Icon name="arrow_forward" className="text-sm" />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-4 relative rounded-2xl overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-surface-container-lowest">
                <img
                  alt="Embutidos"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={BENTO_DELI}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-trust-blue/90 via-trust-blue/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="font-headline-md text-headline-md text-on-primary mb-1">Embutidos</h3>
                  <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 text-mass-yellow font-label-bold text-label-bold hover:text-on-primary transition-colors"
                  >
                    Ver precios <Icon name="arrow_forward" className="text-sm" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                to="/catalogo"
                className="bg-surface-container-lowest border-2 border-trust-blue text-trust-blue font-label-bold text-label-bold py-3 px-8 rounded-full hover:bg-trust-blue hover:text-on-primary transition-all duration-200 inline-flex items-center gap-2 h-12 shadow-[0_4px_16px_rgba(0,51,160,0.08)]"
              >
                VER TODOS LOS PRECIOS
              </Link>
            </div>
          </div>
        </section>

        <section id="ubicame" className="py-section-gap w-full bg-surface relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-mass-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-30" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-50" aria-hidden="true" />
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
            <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-16 shadow-[0_8px_32px_rgba(0,51,160,0.08)] flex flex-col md:flex-row items-center gap-12 border border-outline-variant/30">
              <div className="w-full md:w-1/2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-fixed-dim text-trust-blue mb-6">
                  <FilledIcon name="location_on" />
                </span>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue mb-4">
                  Siempre cerca de ti
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                  Soy la tienda Mass, la más Mass de todos los barrios con productos de calidad y a los mejores precios para
                  que tú y tu familia siempre puedan ahorrar. Busca tu tienda más cercana y empieza a ahorrar.
                </p>
                <Link
                  to="/tiendas"
                  className="bg-trust-blue text-on-primary font-label-bold text-label-bold py-4 px-8 rounded-full hover:bg-trust-blue-dark transition-all duration-200 inline-flex items-center justify-center gap-2 h-12 shadow-[0_4px_16px_rgba(0,51,160,0.2)]"
                >
                  BUSCAR TIENDA
                  <Icon name="search" className="text-sm" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 relative">
                <div className="aspect-video md:aspect-square bg-surface-container-high rounded-2xl overflow-hidden shadow-inner border border-outline-variant/20 relative">
                  <img alt="Mapa de tiendas" className="w-full h-full object-cover" src={STORE_MAP} />
                  <div className="absolute inset-0 flex items-center justify-center bg-trust-blue/10">
                    <div className="absolute top-1/4 left-1/4 bg-mass-yellow w-4 h-4 rounded-full shadow-lg border-2 border-surface-container-lowest animate-pulse" />
                    <div className="absolute bottom-1/3 right-1/3 bg-mass-yellow w-6 h-6 rounded-full shadow-lg border-2 border-surface-container-lowest" />
                    <div className="absolute top-1/2 right-1/4 bg-sale-red w-3 h-3 rounded-full shadow-lg border-2 border-surface-container-lowest" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 w-full bg-[#25D366]/10 border-y border-[#25D366]/20">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgba(37,211,102,0.15)]">
              <div className="flex-1 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center text-on-primary shadow-lg flex-shrink-0">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-[#075E54] mb-2">
                    Únete a mi canal de WhatsApp
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Y entérate antes que nadie de mis precios Mass bajos y promociones exclusivas.
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/51997626315"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-on-primary font-label-bold text-label-bold py-3 px-8 rounded-full hover:bg-[#128C7E] transition-all duration-200 inline-flex items-center justify-center gap-2 h-12 whitespace-nowrap shadow-md"
              >
                UNIRME AL CANAL
              </a>
            </div>
          </div>
        </section>

        <section id="trabaja" className="py-section-gap w-full relative">
          <div className="absolute inset-0 z-0">
            <img alt="" className="w-full h-full object-cover" src={JOB_BG} />
            <div className="absolute inset-0 bg-trust-blue/80 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-r from-trust-blue via-trust-blue/90 to-transparent" />
          </div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 flex items-center min-h-[400px]">
            <div className="w-full md:w-1/2 bg-surface-container-lowest/10 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-on-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="inline-flex items-center gap-3 bg-mass-yellow/90 backdrop-blur-sm text-trust-blue px-4 py-2 rounded-full font-label-bold text-label-bold mb-6">
                <Icon name="work" className="text-lg" />
                FUERZA AMARILLA
              </div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-primary mb-4 leading-tight">
                ¡Tú pones el talento y juntos desarrollamos tu potencial!
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary/90 mb-8">
                Si tienes 18 años en adelante, te apasiona el trabajo en equipo y tienes muchas ganas de crecer
                profesionalmente <strong>¡Únete a la fuerza amarilla!</strong> Nuestras convocatorias son gratuitas.
              </p>
              <Link
                to="/trabaja-con-nosotros"
                className="bg-mass-yellow text-trust-blue font-label-bold text-label-bold py-4 px-8 rounded-full hover:bg-white transition-all duration-200 inline-flex items-center justify-center gap-2 h-12 shadow-[0_4px_16px_rgba(255,209,0,0.3)]"
              >
                INSCRÍBETE AQUÍ
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-highest border-t border-outline-variant w-full pt-section-gap pb-12 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-gutter mb-12">
          <div className="md:col-span-1">
            <img
              alt="Tiendas Mass"
              className="h-10 object-contain mb-6 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              src={logo}
            />
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              El ahorro de tu barrio. Siempre cerca de ti con los mejores precios.
            </p>
            <div className="flex gap-4">
              <a href="#facebook" aria-label="Facebook" className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-trust-blue shadow-sm hover:bg-trust-blue hover:text-on-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#instagram" aria-label="Instagram" className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-trust-blue shadow-sm hover:bg-trust-blue hover:text-on-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#tiktok" aria-label="TikTok" className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-trust-blue shadow-sm hover:bg-trust-blue hover:text-on-primary transition-colors">
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-label-bold text-label-bold text-trust-blue mb-4 uppercase tracking-wider">Conóceme</h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link to="/catalogo" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">
                  Precios Mass
                </Link>
              </li>
              <li>
                <a href="#ubicame" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">Ubícame</a>
              </li>
              <li>
                <a href="#trabaja" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">Trabaja Conmigo</a>
              </li>
              <li>
                <Link to="/contacto" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">¿Cómo ofrecer mi local?</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-bold text-label-bold text-trust-blue mb-4 uppercase tracking-wider">Servicio al Cliente</h4>
            <ul className="flex flex-col gap-3">
              <li>
                <span className="font-body-md text-body-md text-on-surface-variant">Horario: Lunes a domingo de 7 AM a 10 PM</span>
              </li>
              <li>
                <a href="mailto:servicioalcliente@tiendasmass.pe" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">
                  servicioalcliente@tiendasmass.pe
                </a>
              </li>
              <li>
                <Link to="/terminos" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">Políticas de cambios y devoluciones</Link>
              </li>
              <li>
                <Link to="/contacto" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">Comprobante electrónico</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-bold text-label-bold text-trust-blue mb-4 uppercase tracking-wider">Legales</h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link to="/terminos" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">Términos y Condiciones</Link>
              </li>
              <li>
                <Link to="/privacidad" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200">Política de Privacidad</Link>
              </li>
              <li>
                <Link to="/reclamaciones" className="font-body-md text-body-md text-on-surface-variant hover:text-trust-blue transition-colors duration-200 underline">
                  Libro de Reclamaciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-container-max mx-auto border-t border-outline-variant/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body-md text-body-md text-on-surface-variant/80 text-center md:text-left text-sm">
            © 2026 Tiendas Mass. Todos los derechos reservados. Compañía Hard Discount S.A.C
          </p>
          <div className="flex items-center gap-2 text-on-surface-variant/80 text-sm">
            <Icon name="verified_user" className="text-lg" />
            Sitio Seguro
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
