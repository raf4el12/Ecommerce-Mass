import { useState, useEffect } from 'react';
import { useUsuario } from '../context/userContext';

const API_URL = "http://localhost:5001";

export const usePermitedModulos = () => {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useUsuario();

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener permisos');
        }

        const data = await response.json();
        // data.modulos es un array de strings: ["DASHBOARD", "PRODUCTOS", etc]
        setModulos(data.modulos || []);
      } catch (err) {
        console.error('Error al cargar permisos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModulos();
  }, [getToken]);

  return { modulos, loading, error };
};
