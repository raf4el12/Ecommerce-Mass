import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PackageX } from 'lucide-react';
import { useCarrito } from '../../context/carContext';
import ProductCard from './productCard';
import SubcategoriaFilter from '../SubcategoriaFilter';

const API_URL = "http://localhost:5001";

const ProductCardSkeleton = () => (
  <div className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-level-1 animate-pulse">
    <div className="aspect-square bg-surface-container-high" />
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3 w-1/3 bg-surface-container-high rounded-full" />
      <div className="h-5 w-3/4 bg-surface-container-high rounded-full" />
      <div className="h-9 w-1/2 bg-surface-container-high rounded-xl mt-2" />
      <div className="h-12 w-full bg-surface-container-high rounded-full mt-2" />
    </div>
  </div>
);

const Productos = ({ categoriaId, onProductClick }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const { agregarProducto } = useCarrito();

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_URL}/api/products`;
        const params = [];
        if (categoriaId) params.push(`categoriaId=${categoriaId}`);
        if (subcategoriaId) params.push(`subcategoriaId=${subcategoriaId}`);
        if (params.length > 0) url += '?' + params.join('&');

        const res = await axios.get(url);
        setProductos(res.data);
      } catch (err) {
        console.error('Error al obtener productos:', err);
        setError('No pudimos cargar los productos. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [categoriaId, subcategoriaId]);

  useEffect(() => {
    setSubcategoriaId('');
  }, [categoriaId]);

  const gridClass = 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter';

  return (
    <div className="flex flex-col gap-6">
      <SubcategoriaFilter
        categoriaId={categoriaId}
        onSubcategoriaSelect={setSubcategoriaId}
        selectedSubcategoria={subcategoriaId}
      />

      {loading && (
        <div className={gridClass}>
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <PackageX size={48} className="text-error" aria-hidden="true" />
          <p className="font-body-lg text-body-lg text-error">{error}</p>
        </div>
      )}

      {!loading && !error && productos.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <PackageX size={48} className="text-on-surface-variant" aria-hidden="true" />
          <p className="font-headline-sm text-headline-sm text-on-surface">No hay productos para esta categoría</p>
          <p className="font-body-md text-body-md text-on-surface-variant">Prueba con otra categoría o subcategoría.</p>
        </div>
      )}

      {!loading && !error && productos.length > 0 && (
        <div className={gridClass}>
          {productos.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              onAdd={agregarProducto}
              onClick={() => onProductClick && onProductClick(producto)}
              showCategoria={!categoriaId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Productos;
