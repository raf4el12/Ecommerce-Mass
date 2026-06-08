import { useState, useEffect, useCallback } from 'react';
import { getProductos } from '../services/api/productos.api';

export const useProductos = (categoriaId, subcategoriaId, searchQuery) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductos(categoriaId, subcategoriaId, searchQuery);
      setProductos(data);
    } catch (err) {
      console.error('Error al obtener productos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [categoriaId, subcategoriaId, searchQuery]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return { productos, loading, error, refetch: fetchProductos };
};
