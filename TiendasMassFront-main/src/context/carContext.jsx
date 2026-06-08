import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUsuario } from '../context/userContext';

const CarritoContext = createContext();

export const CarritoProvider = ({ children }) => {
  const { usuario } = useUsuario();
  const [carrito, setCarrito] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Función helper para obtener la clave del localStorage
  const getStorageKey = (userId) => `carrito_${userId || 'anonimo'}`;

  // Función para cargar carrito desde localStorage
  const cargarCarrito = (userId) => {
    try {
      const savedCart = localStorage.getItem(getStorageKey(userId));
      const carritoData = savedCart ? JSON.parse(savedCart) : [];
      setCarrito(carritoData);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      setCarrito([]);
      setIsLoaded(true);
    }
  };

  // Función para guardar carrito en localStorage
  const guardarCarrito = (carritoData, userId) => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(carritoData));
    } catch (error) {
      console.error('Error al guardar carrito:', error);
    }
  };

  // Cargar carrito inicial y cuando cambie el usuario
  useEffect(() => {
    cargarCarrito(usuario?.id);
  }, [usuario?.id]);

  // Guardar carrito cuando cambie (solo si ya se cargó inicialmente)
  useEffect(() => {
    if (isLoaded) {
      guardarCarrito(carrito, usuario?.id);
    }
  }, [carrito, usuario?.id, isLoaded]);

  const agregarProducto = (producto) => {
    setCarrito(prev => {
      const existente = prev.find(p => p.id === producto.id);
      let nuevoCarrito;

      if (existente) {
        nuevoCarrito = prev.map(p =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + (producto.cantidad || 1) }
            : p
        );
      } else {
        nuevoCarrito = [...prev, {
          ...producto,
          cantidad: producto.cantidad || 1,
          imagen: producto.imagen || producto.img || '/placeholder-image.jpg'
        }];
      }


      // Guardar inmediatamente después del cambio
      setTimeout(() => guardarCarrito(nuevoCarrito, usuario?.id), 0);
      return nuevoCarrito;
    });
  };

  const quitarProducto = (id) => {
    setCarrito(prev => {
      const nuevoCarrito = prev.filter(p => p.id !== id);
      // Guardar inmediatamente después del cambio
      setTimeout(() => guardarCarrito(nuevoCarrito, usuario?.id), 0);
      return nuevoCarrito;
    });
  };

  const aumentarCantidad = (id) => {
    setCarrito(prev => {
      const nuevoCarrito = prev.map(p =>
        p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
      );
      // Guardar inmediatamente después del cambio
      setTimeout(() => guardarCarrito(nuevoCarrito, usuario?.id), 0);
      return nuevoCarrito;
    });
  };

  const disminuirCantidad = (id) => {
    setCarrito(prev => {
      const nuevoCarrito = prev
        .map(p =>
          p.id === id && p.cantidad > 1
            ? { ...p, cantidad: p.cantidad - 1 }
            : p
        )
        .filter(p => p.cantidad > 0);

      // Guardar inmediatamente después del cambio
      setTimeout(() => guardarCarrito(nuevoCarrito, usuario?.id), 0);
      return nuevoCarrito;
    });
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    try {
      localStorage.removeItem(getStorageKey(usuario?.id));
    } catch (error) {
      console.error('Error al limpiar carrito:', error);
    }
  };

  const total = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarProducto,
        quitarProducto,
        aumentarCantidad,
        disminuirCantidad,
        vaciarCarrito,
        total,
        isLoaded, // Para saber si ya se cargó el carrito inicial
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => useContext(CarritoContext);