import React, { useState } from 'react';
import { X } from 'lucide-react';
import Productos from '../components/productos/productos';
import ProductDetailModal from '../components/productos/detalleproductomodal';
import CategoryCarousel from '../components/carousel/categoriacarousel';

const Catalogo = () => {
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectCategoria = (cat) => {
    setCategoriaActiva(cat);
  };

  const openModal = (producto) => {
    setSelectedProduct(producto);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full space-y-12">
        {/* Banner/Header de Catálogo */}
        <section className="bg-surface rounded-2xl p-8 shadow-level-1 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="font-headline-lg text-headline-lg text-trust-blue mb-4">Catálogo de Productos</h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl">
              Explora todos nuestros productos con los mejores precios. Selecciona una categoría para filtrar o usa el buscador.
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-mass-yellow text-on-surface font-label-bold px-6 py-3 rounded-full shadow-sm">
              Precios Mass
            </div>
            <div className="bg-surface-container-high text-trust-blue font-label-bold px-6 py-3 rounded-full border border-trust-blue/20">
              Ofertas
            </div>
          </div>
        </section>

        {/* Categorías Carousel Wrapper */}
        <section className="w-full">
          <h2 className="font-headline-md text-headline-md text-trust-blue mb-6">Filtrar por Categorías</h2>
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <CategoryCarousel onSelect={handleSelectCategoria} activeId={categoriaActiva?.id ?? null} />
          </div>
        </section>

        {/* Grilla de Productos */}
        <section className="w-full">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h2 className="font-headline-md text-headline-md text-trust-blue">
              {categoriaActiva ? (
                <>Mostrando: <span className="text-on-surface">{categoriaActiva.nombre}</span></>
              ) : 'Todos los Productos'}
            </h2>
            {categoriaActiva && (
              <button
                type="button"
                onClick={() => setCategoriaActiva(null)}
                className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface font-label-bold text-label-bold px-4 py-2 rounded-full hover:bg-surface-container-highest transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
                Quitar filtro
              </button>
            )}
          </div>
          
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] min-h-[500px]">
            <Productos
              categoriaId={categoriaActiva?.id}
              onProductClick={openModal}
            />
          </div>
        </section>
      </main>

      <ProductDetailModal
        isOpen={modalOpen}
        product={selectedProduct}
        onClose={closeModal}
      />
    </div>
  );
};

export default Catalogo;
