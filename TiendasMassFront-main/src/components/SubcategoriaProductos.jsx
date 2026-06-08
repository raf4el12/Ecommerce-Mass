import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './productos/productCard';

const API_URL = 'http://localhost:5001/api';

/**
 * Componente para mostrar subcategorías con sus productos
 * Muestra una vista en acordeón expandible por subcategoría
 */
const SubcategoriaProductos = ({ categoriaId, onProductClick }) => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [productos, setProductos] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedSubcategorias, setExpandedSubcategorias] = useState({});
  const [error, setError] = useState('');

  // Cargar subcategorías
  useEffect(() => {
    if (!categoriaId) return;

    setLoading(true);
    setError('');
    
    axios
      .get(`${API_URL}/subcategorias/categoria/${categoriaId}`)
      .then(res => {
        setSubcategorias(res.data);
        // Expandir todas las subcategorías por defecto
        const expanded = {};
        res.data.forEach(sub => {
          expanded[sub.id] = true;
        });
        setExpandedSubcategorias(expanded);
      })
      .catch(err => {
        console.error('Error cargando subcategorías:', err);
        setError('Error al cargar subcategorías');
      })
      .finally(() => setLoading(false));
  }, [categoriaId]);

  // Cargar productos para cada subcategoría
  useEffect(() => {
    subcategorias.forEach(subcategoria => {
      if (!productos[subcategoria.id]) {
        axios
          .get(`${API_URL}/products?subcategoriaId=${subcategoria.id}`)
          .then(res => {
            setProductos(prev => ({
              ...prev,
              [subcategoria.id]: res.data
            }));
          })
          .catch(err => {
            console.error(`Error cargando productos para subcategoría ${subcategoria.id}:`, err);
            setProductos(prev => ({
              ...prev,
              [subcategoria.id]: []
            }));
          });
      }
    });
  }, [subcategorias]);

  const toggleSubcategoria = (subcategoriaId) => {
    setExpandedSubcategorias(prev => ({
      ...prev,
      [subcategoriaId]: !prev[subcategoriaId]
    }));
  };

  if (loading) {
    return <p>Cargando subcategorías...</p>;
  }

  if (error) {
    return <p style={{ color: '#d32f2f' }}>{error}</p>;
  }

  if (subcategorias.length === 0) {
    return <p>No hay subcategorías para esta categoría</p>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <style>{`
        .subcategoria-container {
          margin-bottom: 2rem;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.4s ease-out;
        }

        .subcategoria-container:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .subcategoria-header {
          width: 100%;
          padding: 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .subcategoria-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          transition: left 0.3s ease;
          z-index: -1;
        }

        .subcategoria-header:hover::before {
          left: 0;
        }

        .subcategoria-header:hover {
          transform: translateY(-1px);
        }

        .subcategoria-title {
          font-weight: 700;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .subcategoria-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .subcategoria-toggle {
          font-size: 1.2rem;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .subcategoria-content {
          background-color: #fff;
          padding: 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
          min-height: 150px;
          animation: slideDown 0.3s ease-out;
        }

        .productos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .productos-empty {
          color: #999;
          text-align: center;
          padding: 2rem 1rem;
          font-size: 1.05rem;
          opacity: 0.7;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }

        @media (max-width: 768px) {
          .subcategoria-header {
            padding: 1rem;
            font-size: 1rem;
          }

          .subcategoria-content {
            padding: 1.5rem;
          }

          .productos-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
      
      {subcategorias.map(subcategoria => (
        <div key={subcategoria.id} className="subcategoria-container">
          {/* Header de subcategoría */}
          <button
            onClick={() => toggleSubcategoria(subcategoria.id)}
            className="subcategoria-header"
          >
            <span className="subcategoria-title">
              <span className="subcategoria-icon">📁</span>
              {subcategoria.nombre}
            </span>
            <span
              className="subcategoria-toggle"
              style={{
                transform: expandedSubcategorias[subcategoria.id] ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              ▼
            </span>
          </button>

          {/* Productos de la subcategoría */}
          {expandedSubcategorias[subcategoria.id] && (
            <div className="subcategoria-content">
              {productos[subcategoria.id] && productos[subcategoria.id].length > 0 ? (
                <div className="productos-grid">
                  {productos[subcategoria.id].map(producto => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      onClick={() => onProductClick && onProductClick(producto)}
                    />
                  ))}
                </div>
              ) : (
                <p className="productos-empty">
                  📦 No hay productos en esta subcategoría
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SubcategoriaProductos;
