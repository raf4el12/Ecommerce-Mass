import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/productos/productCard';
import ProductDetailModal from '../components/productos/detalleproductomodal';

const API_URL = "http://localhost:5001";

const ResultadosBusqueda = () => {
    const [productos, setProductos] = useState([]);
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');
    
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    
    const openModal = (producto) => {
        setSelectedProduct(producto);
        setModalOpen(true);
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setModalOpen(false);
    };

    useEffect(() => {
        const buscarProductos = async () => {
            if (!query) return;
            try {
                const res = await fetch(`${API_URL}/api/products?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setProductos(data);
            } catch (error) {
                console.error('Error al buscar:', error);
            }
        };
        buscarProductos();
    }, [query]);

    return (
        <div className="w-full flex flex-col bg-surface-grey font-body-md text-on-surface">
            <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap w-full space-y-8 min-h-[500px]">
                
                {/* Header Section */}
                <section className="bg-surface rounded-2xl p-8 shadow-level-1 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h1 className="font-headline-lg text-headline-lg text-trust-blue mb-2">Resultados de Búsqueda</h1>
                        <p className="font-body-lg text-on-surface-variant">
                            Buscaste: <span className="font-label-bold text-trust-blue">"{query}"</span> — {productos.length} producto{productos.length !== 1 && 's'} encontrados
                        </p>
                    </div>
                </section>

                {/* Results Grid */}
                <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                    {productos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-6xl text-tertiary-fixed-dim mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>search_off</span>
                            <p className="font-body-lg">No encontramos productos que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
                            {productos.map(producto => (
                                <ProductCard
                                    key={producto.id}
                                    producto={producto}
                                    onClick={openModal}
                                />
                            ))}
                        </div>
                    )}
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

export default ResultadosBusqueda;