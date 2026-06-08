import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './categoria.css';
const API_URL = "http://localhost:5001";
const Categoria = ({ onSelect }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/api/categorias`);
        // Sobrescribimos las imágenes con las que quieres
        const categoriasConImagenes = res.data.map((cat, index) => {
          const imagenes = [
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat1-1.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat2.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat5.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat3.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat7.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat8.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat6.png',
            'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat4.png',
          ];
          return {
            ...cat,
            imagen: imagenes[index] || '/api/placeholder/120/120',
          };
        });
        setCategorias(categoriasConImagenes);
      } catch (err) {
        console.error('Error al obtener categorías:', err);
        setError('Error al cargar categorías');
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);
  
  const next = async () => {
    if (activeStep === 2) {
      // En el paso de pago, crear el pedido
      await crearPedido();
    } else {
      setActiveStep(s => Math.min(s + 1, 3));
    }
  };
  
  const prev = () => setActiveStep(s => Math.max(s - 1, 1));
  const handleSelect = (categoria) => {
    setCategoriaActiva(categoria);
    if (onSelect) onSelect(categoria);
  };

  if (loading) return <p className="loading-text">Cargando categorías...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      <div className="categories-header">
        <h1 className="categories-title">CATEGORÍAS</h1>
      </div>

      <div className="categories-grid">
        {categorias.map(cat => (
          <div
            key={cat.id}
            className={`category-card ${categoriaActiva?.id === cat.id ? 'active' : ''}`}
            onClick={() => handleSelect(cat)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') handleSelect(cat); }}
            aria-pressed={categoriaActiva?.id === cat.id}
          >
            <div className={`category-icon ${cat.claseColor || ''}`}>
              <img src={cat.imagen} alt={cat.nombre} />
            </div>
            <h3 className="category-name">{cat.nombre.toUpperCase()}</h3>
            <span className="category-count">{cat.cantidad} productos</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default Categoria;
