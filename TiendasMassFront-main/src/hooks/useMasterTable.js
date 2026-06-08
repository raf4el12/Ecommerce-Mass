import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api/master-table';

/**
 * Hook custom para gestionar los datos de la Tabla Maestra
 * Conectado con la API del backend
 */
export const useMasterTable = () => {
  const [masterTableData, setMasterTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener token del localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    return token;
  };

  // Headers con autenticación
  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  // Cargar datos del backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      // Mapear campos del backend al frontend (id -> idMasterTable, parentId -> idMasterTableParent, status -> state)
      const mappedData = data.map((item) => ({
        idMasterTable: item.id,
        idMasterTableParent: item.parentId,
        value: item.value,
        description: item.description,
        name: item.name,
        order: item.order,
        additionalOne: item.additionalOne || '–',
        additionalTwo: item.additionalTwo || '–',
        additionalThree: item.additionalThree || '–',
        userNew: item.userNew || 'ADMIN',
        dateNew: item.dateNew ? new Date(item.dateNew).toLocaleDateString('es-PE') : '–',
        userEdit: item.userEdit || '–',
        dateEdit: item.dateEdit ? new Date(item.dateEdit).toLocaleDateString('es-PE') : '–',
        state: item.status || 'A',
      }));
      setMasterTableData(mappedData);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar tabla maestra:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Crear nuevo registro
  const addRecord = async (formData) => {
    try {
      setLoading(true);
      const payload = {
        parentId: formData.idMasterTableParent || null,
        value: formData.value || null,
        description: formData.description || null,
        name: formData.name,
        order: formData.order || 0,
        additionalOne: formData.additionalOne || null,
        additionalTwo: formData.additionalTwo || null,
        additionalThree: formData.additionalThree || null,
        userNew: localStorage.getItem('adminUser')
          ? JSON.parse(localStorage.getItem('adminUser')).nombre
          : 'ADMIN',
        status: formData.state || 'A',
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear registro');
      }

      const newRecord = await response.json();
      // Refrescar datos
      await fetchData();
      return newRecord;
    } catch (err) {
      setError(err.message);
      console.error('Error al crear registro:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar registro
  const updateRecord = async (idMasterTable, formData) => {
    try {
      setLoading(true);
      const payload = {
        parentId: formData.idMasterTableParent || null,
        value: formData.value || null,
        description: formData.description || null,
        name: formData.name,
        order: formData.order || 0,
        additionalOne: formData.additionalOne || null,
        additionalTwo: formData.additionalTwo || null,
        additionalThree: formData.additionalThree || null,
        userEdit: localStorage.getItem('adminUser')
          ? JSON.parse(localStorage.getItem('adminUser')).nombre
          : 'ADMIN',
        status: formData.state || 'A',
      };

      const response = await fetch(`${API_URL}/${idMasterTable}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar registro');
      }

      // Refrescar datos
      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error('Error al actualizar registro:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar registro
  const deleteRecord = async (idMasterTable) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/${idMasterTable}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar registro');
      }

      // Refrescar datos
      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error('Error al eliminar registro:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHierarchicalData = () => {
    return masterTableData.filter((item) => item.idMasterTableParent === null);
  };

  const getChildrenItems = (parentId) => {
    return masterTableData.filter((item) => item.idMasterTableParent === parentId);
  };

  return {
    masterTableData,
    addRecord,
    updateRecord,
    deleteRecord,
    getHierarchicalData,
    getChildrenItems,
    loading,
    error,
    refetch: fetchData,
  };
};
