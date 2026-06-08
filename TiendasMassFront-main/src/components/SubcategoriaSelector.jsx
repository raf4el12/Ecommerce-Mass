import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

/**
 * Componente selector de subcategorías
 * Carga dinámicamente las subcategorías cuando cambia la categoría
 */
const SubcategoriaSelector = ({ 
  categoriaId, 
  subcategoriaId, 
  onChange,
  isRequired = false,
  className = '',
  disabled = false,
  showLabel = true
}) => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (categoriaId) {
      setLoading(true);
      setError('');
      axios
        .get(`${API_URL}/subcategorias/categoria/${categoriaId}`)
        .then(res => {
          setSubcategorias(res.data);
        })
        .catch(err => {
          console.error('Error cargando subcategorías:', err);
          setError('Error al cargar subcategorías');
          setSubcategorias([]);
        })
        .finally(() => setLoading(false));
    } else {
      setSubcategorias([]);
      setError('');
    }
  }, [categoriaId]);

  return (
    <div className={className}>
      <style>{`
        .subcategoria-selector-container {
          width: 100%;
        }

        .subcategoria-selector-label {
          display: block;
          margin-bottom: 0.6rem;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .subcategoria-selector-label span.required {
          color: #f45c43;
          margin-left: 0.2rem;
        }

        .subcategoria-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          font-size: 0.95rem;
          font-family: inherit;
          background-color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23667eea' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        .subcategoria-select:hover:not(:disabled) {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .subcategoria-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
        }

        .subcategoria-select:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .subcategoria-message {
          font-size: 0.85rem;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .subcategoria-error {
          color: #f45c43;
        }

        .subcategoria-warning {
          color: #ff6f00;
        }

        .subcategoria-info {
          color: #666;
        }

        @media (max-width: 768px) {
          .subcategoria-select {
            font-size: 0.9rem;
            padding: 0.65rem 0.9rem;
            padding-right: 2.2rem;
          }
        }
      `}</style>

      <div className="subcategoria-selector-container">
        {showLabel && (
          <label htmlFor="subcategoriaId" className="subcategoria-selector-label">
            Subcategoría {isRequired && <span className="required">*</span>}
          </label>
        )}
        <select
          id="subcategoriaId"
          value={subcategoriaId || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading || !categoriaId || subcategorias.length === 0}
          className="subcategoria-select"
        >
          <option value="">
            {loading ? '⏳ Cargando subcategorías...' : '▼ Selecciona una subcategoría'}
          </option>
          {subcategorias.length > 0 && !loading && (
            subcategorias.map(subcategoria => (
              <option key={subcategoria.id} value={subcategoria.id}>
                📁 {subcategoria.nombre}
              </option>
            ))
          )}
        </select>
        {error && <p className="subcategoria-message subcategoria-error">❌ {error}</p>}
        {!loading && categoriaId && subcategorias.length === 0 && (
          <p className="subcategoria-message subcategoria-warning">
            ⚠️ No hay subcategorías para esta categoría
          </p>
        )}
        {!categoriaId && (
          <p className="subcategoria-message subcategoria-info">
            ℹ️ Selecciona una categoría primero
          </p>
        )}
      </div>
    </div>
  );
};

export default SubcategoriaSelector;
