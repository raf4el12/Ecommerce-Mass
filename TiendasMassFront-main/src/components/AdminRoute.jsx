import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUsuario } from '../context/userContext';
import SetupAdmin from '../admin/components/SetupAdmin';

const API_URL = "http://localhost:5001";

const AdminRoute = ({ children }) => {
  const { usuario } = useUsuario();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [tieneAcceso, setTieneAcceso] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  useEffect(() => {
    verificarAccesoAdmin();
  }, [usuario]);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/setup/status`);
      const data = await response.json();
      setNeedsSetup(data.needsSetup);
      setCheckingSetup(false);
    } catch (error) {
      setCheckingSetup(false);
      setNeedsSetup(false);
    }
  };

  const verificarAccesoAdmin = async () => {
    setVerificando(true);
    try {
      // Opción 1: Verificar si está logueado como admin
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');

      if (adminToken && adminUser) {
        try {
          const userData = JSON.parse(adminUser);
          // Verificar permisos del admin logueado
          const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Si tiene modulos, tiene acceso
            setTieneAcceso(data.modulos && data.modulos.length > 0);
            setVerificando(false);
            return;
          }
        } catch (error) {
          console.error('Error verificando permisos:', error);
        }
      }

      // Opción 2: Verificar si es usuario normal autenticado con permisos
      if (usuario) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`${API_URL}/api/permisos/me/modulos`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              setTieneAcceso(data.modulos && data.modulos.length > 0);
              setVerificando(false);
              return;
            }
          } catch (error) {
            console.error('Error verificando permisos:', error);
          }
        }
      }

      setTieneAcceso(false);
    } finally {
      setVerificando(false);
    }
  };

  if (checkingSetup || verificando) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Verificando acceso...</div>
    </div>;
  }

  if (needsSetup) {
    return <SetupAdmin />;
  }

  // Verificar si está autenticado (admin o usuario normal)
  const adminToken = localStorage.getItem('adminToken');
  const estaLogueado = adminToken || usuario;

  if (!estaLogueado) {
    console.log('No está logueado');
    return <Navigate to="/login" />;
  }

  // Verificar si tiene acceso
  if (!tieneAcceso) {
    console.log('No tiene acceso - sin permisos');
    return <Navigate to="/" />;
  }

  // Si tiene acceso, mostrar el contenido protegido
  return children;
};

export default AdminRoute; 