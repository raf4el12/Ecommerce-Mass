import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = "http://localhost:5001";

const Arrow = ({ onClick, direction }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={direction === 'left' ? 'Categorías anteriores' : 'Más categorías'}
    className={`absolute top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-trust-blue text-white shadow-level-1 hover:bg-trust-blue-dark hover:shadow-level-2 transition-all ${direction === 'left' ? '-left-3' : '-right-3'}`}
  >
    {direction === 'left' ? <ChevronLeft size={22} strokeWidth={2.5} /> : <ChevronRight size={22} strokeWidth={2.5} />}
  </button>
);

const CategoryCarousel = ({ onSelect, activeId = null }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categorias`);
        const imgs = [
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat1-1.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat2.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat5.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat3.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat7.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat8.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat6.png',
          'https://www.tiendasmass.com.pe/wp-content/uploads/2023/06/cat4.png',
        ];
        const dataWithImages = res.data.map((cat, i) => ({
          ...cat,
          imagen: imgs[i] || '/api/placeholder/120/120',
        }));
        setCategorias(dataWithImages);
      } catch (err) {
        setError('No pudimos cargar las categorías.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  const settings = {
    dots: false,
    infinite: categorias.length > 5,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    nextArrow: <Arrow direction="right" />,
    prevArrow: <Arrow direction="left" />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 576, settings: { slidesToShow: 2 } },
    ],
  };

  const handleClick = cat => {
    const next = activeId === cat.id ? null : cat;
    if (onSelect) onSelect(next);
  };

  if (loading) {
    return (
      <div className="flex gap-gutter overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 flex-1 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-surface-container-high" />
            <div className="h-3 w-16 bg-surface-container-high rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <p className="text-center font-body-md text-body-md text-error py-6">{error}</p>;
  if (!categorias.length) return <p className="text-center font-body-md text-body-md text-on-surface-variant py-6">No hay categorías para mostrar.</p>;

  return (
    <div className="relative px-6">
      <Slider {...settings}>
        {categorias.map(cat => {
          const isActive = activeId === cat.id;
          return (
            <div key={cat.id} className="px-2 py-2 outline-none">
              <button
                type="button"
                onClick={() => handleClick(cat)}
                aria-pressed={isActive}
                className="group flex flex-col items-center gap-3 w-full focus:outline-none"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center p-4 transition-all duration-200 group-hover:-translate-y-1 ${
                    isActive
                      ? 'bg-mass-yellow shadow-level-2 ring-2 ring-trust-blue'
                      : 'bg-surface-grey shadow-level-1 group-hover:shadow-level-2'
                  }`}
                >
                  <img
                    src={cat.imagen}
                    alt={cat.nombre}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    loading="lazy"
                  />
                </div>
                <h3 className={`font-label-bold text-label-bold uppercase tracking-wide text-center transition-colors ${isActive ? 'text-trust-blue' : 'text-on-surface group-hover:text-trust-blue'}`}>
                  {cat.nombre}
                </h3>
              </button>
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default CategoryCarousel;
