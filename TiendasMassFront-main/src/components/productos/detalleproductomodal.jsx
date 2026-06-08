import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useCarrito } from '../../context/carContext';
import CategoryPlaceholder from './CategoryPlaceholder';

const API_URL = "http://localhost:5001";

const getImageUrl = (producto) => {
  if (!producto?.imagen) return null;
  if (producto.imagen.startsWith('http')) return producto.imagen;
  return `${API_URL}/${producto.imagen}`;
};

const ProductDetailModal = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const { agregarProducto } = useCarrito();

  useEffect(() => {
    if (isOpen) setQuantity(1);
    setImgError(false);
  }, [isOpen, product]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const precio = parseFloat(product.precio);
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleAdd = () => {
    agregarProducto({ ...product, cantidad: quantity });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile bg-on-surface/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-level-2 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Imagen */}
          <div className="bg-surface-grey p-8 flex items-center justify-center min-h-[280px]">
            {(!product.imagen || imgError) ? (
              <CategoryPlaceholder categoria={product.categoria?.nombre} iconSize={96} />
            ) : (
              <img
                src={getImageUrl(product)}
                alt={product.nombre}
                className="max-h-[320px] max-w-full object-contain"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* Detalles */}
          <div className="p-6 md:p-8 flex flex-col gap-3">
            {product.categoria?.nombre && (
              <span className="self-start bg-mass-yellow text-on-surface font-label-bold text-label-bold px-3 py-1 rounded-full">
                {product.categoria.nombre}
              </span>
            )}

            <h2 id="modal-title" className="font-headline-md text-headline-md text-on-surface">
              {product.nombre}
            </h2>

            {product.marca && (
              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wide">
                {product.marca}
              </p>
            )}

            <p className="font-body-md text-body-md text-on-surface-variant">
              {product.descripcion}
            </p>

            <span className="self-start bg-mass-yellow text-on-surface font-price-display text-price-display px-4 py-2 rounded-xl my-2">
              S/ {precio.toFixed(2)}
            </span>

            {/* Cantidad */}
            <div className="flex items-center gap-4">
              <span className="font-label-bold text-label-bold text-on-surface">Cantidad</span>
              <div className="inline-flex items-center rounded-full border border-outline-variant overflow-hidden">
                <button
                  onClick={decrementQuantity}
                  aria-label="Disminuir cantidad"
                  className="w-10 h-10 inline-flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span className="w-12 text-center font-label-bold text-label-bold" aria-live="polite">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  aria-label="Aumentar cantidad"
                  className="w-10 h-10 inline-flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-trust-blue text-white font-label-bold text-label-bold rounded-full min-h-[48px] px-6 hover:bg-trust-blue-dark transition-colors shadow-level-1 hover:shadow-level-2"
            >
              <ShoppingCart size={20} strokeWidth={2.5} />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
