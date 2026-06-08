import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

/**
 * Componente selector de múltiples subcategorías
 * Permite seleccionar varias subcategorías de una categoría específica
 */
const SubcategoriasMultiples = ({
  categoriaId,
  selectedIds = [],
  onChange,
  disabled = false,
  isRequired = false,
  className = '',
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
    }
  }, [categoriaId]);

  const handleToggle = (subcategoriaId) => {
    const newIds = selectedIds.includes(subcategoriaId)
      ? selectedIds.filter(id => id !== subcategoriaId)
      : [...selectedIds, subcategoriaId];
    onChange(newIds);
  };

  const handleRemove = (subcategoriaId) => {
    const newIds = selectedIds.filter(id => id !== subcategoriaId);
    onChange(newIds);
  };

  const selectedSubcategorias = subcategorias.filter(sub =>
    selectedIds.includes(sub.id)
  );

  return (
    <div className={`form-group ${className}`}>
      {showLabel && (
        <label className="form-label">
          Subcategorías {isRequired && '*'}
        </label>
      )}

      {loading ? (
        <p className="text-muted">Cargando subcategorías...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : subcategorias.length === 0 ? (
        <p className="text-muted">No hay subcategorías disponibles para esta categoría</p>
      ) : (
        <>
          {/* Selector de subcategorías */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {subcategorias.map(subcategoria => (
              <label
                key={subcategoria.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  padding: '0.5rem',
                  backgroundColor: selectedIds.includes(subcategoria.id)
                    ? '#e7f3ff'
                    : 'transparent',
                  borderRadius: '4px',
                  border: selectedIds.includes(subcategoria.id)
                    ? '1px solid #0dcaf0'
                    : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(subcategoria.id)}
                  onChange={() => handleToggle(subcategoria.id)}
                  disabled={disabled}
                  style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem' }}>{subcategoria.nombre}</span>
              </label>
            ))}
          </div>

          {/* Badges de subcategorías seleccionadas */}
          {selectedSubcategorias.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedSubcategorias.map(subcategoria => (
                <div
                  key={subcategoria.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#0dcaf0',
                    color: '#000',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  {subcategoria.nombre}
                  <button
                    type="button"
                    onClick={() => handleRemove(subcategoria.id)}
                    disabled={disabled}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: '#000',
                      opacity: 0.7
                    }}
                    title="Remover"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedSubcategorias.length === 0 && (
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Selecciona una o más subcategorías
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default SubcategoriasMultiples;
