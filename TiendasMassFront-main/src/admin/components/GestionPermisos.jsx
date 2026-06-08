import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import swal from 'sweetalert2';
import { useUsuario } from '../../context/userContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const API_URL = 'http://localhost:5001';

const GestionPermisos = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [catalogo, setCatalogo] = useState({ modulos: [], acciones: [] });
  const [permisosActuales, setPermisosActuales] = useState([]);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { getAuthHeaders } = useUsuario();

  useEffect(() => {
    fetchRoles();
    fetchCatalogo();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/roles`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
      setRoles(response.data);
    } catch (error) {
      console.error('Error al obtener roles:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron obtener los roles.'
      });
    }
  };

  const fetchCatalogo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/permisos/catalogo`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
      setCatalogo(response.data);
      if (!response.data || !response.data.modulos || response.data.modulos.length === 0) {
        swal.fire({
          icon: 'info',
          title: 'Catálogo vacío',
          text: 'No se encontraron módulos en el catálogo.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error al obtener catálogo:', error);
      const status = error.response?.status;
      if (status === 401) {
        swal.fire({ icon: 'error', title: 'No autenticado', text: 'Inicia sesión como administrador.' });
      } else if (status === 403) {
        swal.fire({ icon: 'error', title: 'Sin permisos', text: 'Necesitas ser administrador para ver el catálogo.' });
      } else {
        swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron obtener los módulos y acciones.' });
      }
    }
  };

  const fetchPermisosRol = async (roleId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/permisos/roles/${roleId}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
      const { permisos, roleName } = response.data;
      setSelectedRoleName(roleName);
      setPermisosActuales(permisos);
      
      const permisosSet = new Set();
      permisos.forEach(p => {
        permisosSet.add(`${p.modulo}|${p.accion}`);
      });
      setPermisosSeleccionados(permisosSet);
    } catch (error) {
      console.error('Error al obtener permisos del rol:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron obtener los permisos del rol.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const roleId = Number(e.target.value);
    setSelectedRoleId(roleId);
    
    if (roleId) {
      fetchPermisosRol(roleId);
    } else {
      setPermisosActuales([]);
      setPermisosSeleccionados(new Set());
      setSelectedRoleName('');
    }
  };

  const handlePermisoChange = (modulo, accion) => {
    const key = `${modulo}|${accion}`;
    const newSet = new Set(permisosSeleccionados);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setPermisosSeleccionados(newSet);
  };

  const handleGuardarPermisos = async () => {
    if (!selectedRoleId) {
      swal.fire({
        icon: 'warning',
        title: 'Selecciona un rol',
        text: 'Por favor selecciona un rol para asignar permisos.'
      });
      return;
    }

    try {
      setGuardando(true);
      const permisos = Array.from(permisosSeleccionados).map(key => {
        const [modulo, accion] = key.split('|');
        return { modulo, accion };
      });

      await axios.put(
        `${API_URL}/api/permisos/roles/${selectedRoleId}`,
        { permisos },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );

      swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Permisos actualizados para el rol "${selectedRoleName}"`
      });

      setPermisosActuales(permisos);
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudieron actualizar los permisos.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleResetPermisos = () => {
    const permisosSet = new Set();
    permisosActuales.forEach(p => {
      permisosSet.add(`${p.modulo}|${p.accion}`);
    });
    setPermisosSeleccionados(permisosSet);
  };

  const handleSeleccionarTodos = () => {
    const newSet = new Set();
    catalogo.modulos.forEach(modulo => {
      catalogo.acciones.forEach(accion => {
        newSet.add(`${modulo}|${accion}`);
      });
    });
    setPermisosSeleccionados(newSet);
  };

  const handleDeseleccionarTodos = () => {
    setPermisosSeleccionados(new Set());
  };

  const contarPermisosActuales = () => permisosActuales.length;
  const contarPermisosSeleccionados = () => permisosSeleccionados.size;
  const permisosCambiaron = contarPermisosActuales() !== contarPermisosSeleccionados() ||
    !permisosActuales.every(p => permisosSeleccionados.has(`${p.modulo}|${p.accion}`));

  return (
    <div className="px-margin-mobile md:px-margin-desktop pt-6 pb-12 max-w-container-max mx-auto w-full fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
            Gestión de Permisos por Rol
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Asigna permisos a los roles para controlar el acceso a los módulos y acciones
          </p>
        </div>
      </div>

      <Card className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="w-full md:w-80">
            <label className="font-label-bold text-label-bold text-on-surface mb-2 block">
              Seleccionar Rol:
            </label>
            <select
              className="w-full bg-surface-grey border-2 border-transparent focus:border-trust-blue rounded-lg py-2 px-4 font-body-md text-body-md text-on-background outline-none transition-colors shadow-sm"
              value={selectedRoleId || ''}
              onChange={handleRoleChange}
              disabled={roles.length === 0}
            >
              <option value="">-- Selecciona un rol --</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>

          {selectedRoleId && (
            <div className="flex flex-col sm:flex-row gap-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant w-full md:w-auto">
              <div className="flex flex-col">
                <span className="font-label-md text-on-surface-variant">Permisos Actuales:</span>
                <span className="font-headline-sm text-trust-blue">{contarPermisosActuales()}</span>
              </div>
              <div className="hidden sm:block w-px bg-outline-variant mx-2"></div>
              <div className="flex flex-col">
                <span className="font-label-md text-on-surface-variant">A Guardar:</span>
                <span className={`font-headline-sm ${permisosCambiaron ? 'text-mass-yellow font-bold' : 'text-trust-blue'}`}>
                  {contarPermisosSeleccionados()}
                </span>
              </div>
            </div>
          )}
        </div>

        {selectedRoleId && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 pb-6 border-b border-surface-container-highest">
              <Button variant="outline" onClick={handleSeleccionarTodos}>✓ Seleccionar Todo</Button>
              <Button variant="outline" onClick={handleDeseleccionarTodos}>✕ Desseleccionar Todo</Button>
              <Button 
                variant="outline" 
                onClick={handleResetPermisos}
                disabled={!permisosCambiaron}
                leadingIcon={<RefreshCw size={16} />}
              >
                Restaurar
              </Button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-on-surface-variant">Cargando permisos...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-surface-container-highest">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-surface-container-highest">
                    <tr>
                      <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">
                        Módulo
                      </th>
                      {catalogo.acciones.map(accion => (
                        <th key={accion} className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap text-center">
                          {accion}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest font-body-md text-body-md">
                    {catalogo.modulos.map(modulo => (
                      <tr key={modulo} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-semibold text-on-surface border-r border-surface-container-highest whitespace-nowrap">
                          {modulo}
                        </td>
                        {catalogo.acciones.map(accion => {
                          const key = `${modulo}|${accion}`;
                          const isChecked = permisosSeleccionados.has(key);
                          const wasChecked = permisosActuales.some(p => p.modulo === modulo && p.accion === accion);
                          const hasChanged = isChecked !== wasChecked;

                          return (
                            <td key={key} className={`py-4 px-6 text-center ${hasChanged ? 'bg-secondary-container/20' : ''}`}>
                              <label className="flex items-center justify-center cursor-pointer w-full h-full">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermisoChange(modulo, accion)}
                                  className="w-5 h-5 rounded border-2 border-outline-variant text-trust-blue focus:ring-trust-blue accent-trust-blue"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-surface-container-highest">
              <div className="flex items-center gap-2">
                {permisosCambiaron ? (
                  <>
                    <AlertCircle size={20} className="text-mass-yellow" />
                    <span className="font-label-bold text-mass-yellow">Hay cambios sin guardar</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} className="text-success" />
                    <span className="font-label-bold text-success">Permisos sincronizados</span>
                  </>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleGuardarPermisos}
                disabled={!permisosCambiaron || guardando}
                leadingIcon={<Save size={18} />}
                className="w-full sm:w-auto"
              >
                {guardando ? 'Guardando...' : 'Guardar Permisos'}
              </Button>
            </div>
          </div>
        )}

        {!selectedRoleId && roles.length > 0 && (
          <div className="text-center py-12 text-on-surface-variant font-body-lg">
            Selecciona un rol para gestionar sus permisos
          </div>
        )}
      </Card>
    </div>
  );
};

export default GestionPermisos;
