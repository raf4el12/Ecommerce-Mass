import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUsuario } from '../context/userContext';

const API_URL = "http://localhost:5001";

const ProtectedRoute = ({ children, requiredModule }) => {
  const { getToken } = useUsuario();
  const [tienePermiso, setTienePermiso] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    verificarPermiso();
  }, [getToken]);

  const verificarPermiso = async () => {
    setVerificando(true);
    try {
      const token = getToken();
      if (!token) {
        setTienePermiso(false);
        setVerificando(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Verificar si tiene permiso para el módulo requerido
        const tieneModulo = data.modulos && data.modulos.includes(requiredModule);
        setTienePermiso(tieneModulo);
      } else {
        setTienePermiso(false);
      }
    } catch (error) {
      console.error('Error verificando permiso:', error);
      setTienePermiso(false);
    } finally {
      setVerificando(false);
    }
  };

  if (verificando) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Verificando acceso...</div>
    </div>;
  }

  if (!tienePermiso) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
