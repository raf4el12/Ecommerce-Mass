import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import CategoryPlaceholder from './CategoryPlaceholder';

const API_URL = "http://localhost:5001";

const getImageUrl = (producto) => {
  if (!producto?.imagen) return null;
  if (producto.imagen.startsWith('http')) return producto.imagen;
  return `${API_URL}/${producto.imagen}`;
};

export default function ProductCard({ producto, onAdd, onClick, showCategoria = true }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [producto]);

  const precio = parseFloat(producto.precio);
  const precioAnterior = producto.precioAnterior ? parseFloat(producto.precioAnterior) : null;
  const tieneOferta = precioAnterior && precioAnterior > precio;
  const descuento = tieneOferta ? Math.round((1 - precio / precioAnterior) * 100) : 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(producto);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAdd({ ...producto, cantidad: 1 });
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `${producto.nombre} agregado al carrito`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return (
    <article
      className="group relative flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-blue focus-visible:ring-offset-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(producto)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Producto: ${producto.nombre}. Marca: ${producto.marca}. Precio: S/ ${precio.toFixed(2)}. ${producto.descripcion}`}
    >
      {/* Imagen */}
      <div className="relative aspect-square bg-surface-grey p-6 flex items-center justify-center">
        {(!producto.imagen || imgError) ? (
          <CategoryPlaceholder categoria={producto.categoria?.nombre} iconSize={72} />
        ) : (
          <img
            src={getImageUrl(producto)}
            alt={`Imagen del producto ${producto.nombre} de la marca ${producto.marca}`}
            className={`max-h-full max-w-full object-contain transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {showCategoria && producto.categoria?.nombre && (
            <span className="bg-mass-yellow text-on-surface font-label-bold text-label-bold px-3 py-1 rounded-full shadow-sm">
              {producto.categoria.nombre}
            </span>
          )}
        </div>
        {tieneOferta && (
          <span className="absolute top-3 right-3 bg-sale-red text-white font-label-bold text-label-bold px-3 py-1 rounded-full shadow-sm">
            -{descuento}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-1">
        <h4 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wide" aria-label={`Marca: ${producto.marca}`}>
          {producto.marca}
        </h4>
        <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 leading-tight">
          {producto.nombre}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-1">
          {producto.descripcion}
        </p>

        {/* Precio */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {tieneOferta && (
              <span className="font-body-md text-body-md text-on-surface-variant line-through">
                S/ {precioAnterior.toFixed(2)}
              </span>
            )}
            <span
              className="bg-mass-yellow text-on-surface font-price-display text-price-display !text-3xl px-3 py-1 rounded-xl"
              aria-label={`Precio: ${precio.toFixed(2)} soles`}
            >
              S/ {precio.toFixed(2)}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleAddToCart}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-trust-blue text-white font-label-bold text-label-bold rounded-full min-h-[48px] px-6 hover:bg-trust-blue-dark transition-colors shadow-level-1 hover:shadow-level-2"
          aria-label={`Agregar ${producto.nombre} al carrito`}
        >
          <ShoppingCart size={18} strokeWidth={2.5} aria-hidden="true" />
          <span>Añadir al carrito</span>
        </button>
      </div>
    </article>
  );
}
