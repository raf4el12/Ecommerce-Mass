import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Phone, Search, Store, Clock } from 'lucide-react';

const API_URL = "http://localhost:5001";
const FACHADA = '/images/tienda-familia.png'; // fachada de marca como fallback

const tiendaImg = (t) => (t.imagen ? `${API_URL}/${t.imagen}` : FACHADA);

const TiendaCardSkeleton = () => (
  <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-level-1 animate-pulse flex flex-col">
    <div className="h-40 bg-surface-container-high" />
    <div className="flex flex-col gap-3 p-6">
      <div className="h-4 w-full bg-surface-container-high rounded-full" />
      <div className="h-4 w-1/2 bg-surface-container-high rounded-full" />
    </div>
  </div>
);

const Tiendas = () => {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tiendas/activas`);
        if (!res.ok) throw new Error('Error al cargar tiendas');
        const data = await res.json();
        setTiendas(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('No pudimos cargar las tiendas. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchTiendas();
  }, []);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tiendas;
    return tiendas.filter(t =>
      [t.nombre, t.direccion, t.ciudad, t.distrito].filter(Boolean).some(v => v.toLowerCase().includes(q))
    );
  }, [tiendas, query]);

  return (
    <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface min-h-screen">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full space-y-10">
        {/* Header */}
        <section className="bg-surface rounded-2xl p-8 shadow-level-1 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mass-yellow text-trust-blue mb-4">
              <MapPin strokeWidth={2.5} />
            </span>
            <h1 className="font-headline-lg text-headline-lg text-trust-blue mb-2">Nuestras Tiendas</h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl">
              Encuentra tu tienda Mass más cercana. Siempre cerca de ti, con los mejores precios del barrio.
            </p>
          </div>
        </section>

        {/* Buscador */}
        <div className="relative max-w-xl">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre, distrito o dirección…"
            aria-label="Buscar tienda"
            className="w-full bg-surface-container-lowest border-2 border-transparent focus:border-trust-blue focus:bg-white rounded-full py-3 pl-12 pr-4 outline-none transition-colors shadow-level-1"
          />
        </div>

        {/* Resultados */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {Array.from({ length: 6 }).map((_, i) => <TiendaCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
            <Store size={48} className="text-error" aria-hidden="true" />
            <p className="font-body-lg text-body-lg text-error">{error}</p>
          </div>
        )}

        {!loading && !error && filtradas.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
            <Store size={48} className="text-on-surface-variant" aria-hidden="true" />
            <p className="font-headline-sm text-headline-sm text-on-surface">
              {tiendas.length === 0 ? 'No hay tiendas disponibles' : 'Sin resultados para tu búsqueda'}
            </p>
            <p className="font-body-md text-on-surface-variant">Prueba con otro nombre o distrito.</p>
          </div>
        )}

        {!loading && !error && filtradas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {filtradas.map((t) => (
              <article key={t.id} className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 transition-all duration-200 flex flex-col">
                {/* Cabecera con imagen de fachada + nombre */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={tiendaImg(t)}
                    alt={`Tienda ${t.nombre}`}
                    onError={(e) => { e.currentTarget.src = FACHADA; }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-trust-blue/90 via-trust-blue/30 to-transparent" />
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-mass-yellow text-trust-blue font-label-bold text-label-bold px-3 py-1 rounded-full shadow-sm">
                    <Store size={14} strokeWidth={2.5} /> Mass
                  </span>
                  <h3 className="absolute bottom-0 left-0 p-4 font-headline-sm text-headline-sm text-white leading-tight">{t.nombre}</h3>
                </div>

                {/* Info */}
                <div className="flex flex-col gap-3 p-6">
                {t.direccion && (
                  <p className="flex items-start gap-2 font-body-md text-on-surface-variant">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-trust-blue" aria-hidden="true" />
                    <span>{t.direccion}{t.distrito ? `, ${t.distrito}` : ''}{t.ciudad ? `, ${t.ciudad}` : ''}</span>
                  </p>
                )}
                {t.telefono && (
                  <p className="flex items-center gap-2 font-body-md text-on-surface-variant">
                    <Phone size={16} className="shrink-0 text-trust-blue" aria-hidden="true" />
                    <a href={`tel:${t.telefono}`} className="hover:text-trust-blue transition-colors">{t.telefono}</a>
                  </p>
                )}
                {t.horario && (
                  <p className="flex items-center gap-2 font-body-md text-on-surface-variant">
                    <Clock size={16} className="shrink-0 text-trust-blue" aria-hidden="true" />
                    <span>{t.horario}</span>
                  </p>
                )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Tiendas;
