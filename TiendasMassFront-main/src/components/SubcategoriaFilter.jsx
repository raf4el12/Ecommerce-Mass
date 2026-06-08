import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SlidersHorizontal, Check } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

/**
 * Filtro de subcategorías (Barrio Moderno). Se muestra cuando la categoría tiene subcategorías.
 */
const SubcategoriaFilter = ({ categoriaId, onSubcategoriaSelect, selectedSubcategoria = '' }) => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }
    setLoading(true);
    axios
      .get(`${API_URL}/subcategorias/categoria/${categoriaId}`)
      .then(res => setSubcategorias(res.data))
      .catch(err => {
        console.error('Error cargando subcategorías:', err);
        setSubcategorias([]);
      })
      .finally(() => setLoading(false));
  }, [categoriaId]);

  if (!categoriaId) return null;
  if (!loading && subcategorias.length === 0) return null;

  const chipBase =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-label-bold text-label-bold transition-all duration-200 border-2';
  const chipActive = 'bg-trust-blue text-white border-trust-blue shadow-level-1';
  const chipIdle = 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-trust-blue hover:text-trust-blue';

  return (
    <div className="bg-surface-grey rounded-2xl p-5 mb-2">
      <h3 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface mb-4">
        <SlidersHorizontal size={20} strokeWidth={2.5} className="text-trust-blue" />
        Filtrar por subcategoría
      </h3>

      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-surface-container-high rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSubcategoriaSelect('')}
            className={`${chipBase} ${!selectedSubcategoria ? chipActive : chipIdle}`}
            aria-pressed={!selectedSubcategoria}
          >
            {!selectedSubcategoria && <Check size={16} strokeWidth={3} />}
            Todas
          </button>

          {subcategorias.map(sub => {
            const active = selectedSubcategoria === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSubcategoriaSelect(active ? '' : sub.id)}
                className={`${chipBase} ${active ? chipActive : chipIdle}`}
                aria-pressed={active}
              >
                {active && <Check size={16} strokeWidth={3} />}
                {sub.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubcategoriaFilter;
