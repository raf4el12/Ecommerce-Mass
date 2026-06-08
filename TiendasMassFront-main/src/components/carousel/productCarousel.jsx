import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Slider from 'react-slick';
import ProductCard from '../productos/productCard';
import { useCarrito } from '../../context/carContext';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './productcarousel.css';
const API_URL = "http://localhost:5001";
const ProductCarousel = ({ onProductClick }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { agregarProducto } = useCarrito();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products`);
        setProductos(res.data);
      } catch (err) {
        setError('Error al cargar productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const handleAgregar = (productoConCantidad) => {
    agregarProducto(productoConCantidad);
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 2 } },
      { breakpoint: 576, settings: { slidesToShow: 1 } },
    ],
  };

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (productos.length === 0) return <p>No hay productos para mostrar.</p>;

  return (
    <Slider {...settings}>
      {productos.map(producto => (
        <div key={producto.id} style={{ padding: '0 10px' }}>
          <ProductCard
            producto={producto}
            onAdd={handleAgregar}
            onClick={() => onProductClick && onProductClick(producto)} // Llama a la función cuando se hace clic
          />
        </div>
      ))}
    </Slider>
  );
};

export default ProductCarousel;
