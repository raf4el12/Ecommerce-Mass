import React, { useState } from 'react';
import { Edit, Trash2, Plus, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import MasterTableModal from './MasterTableModal';
import { useMasterTable } from '../../hooks/useMasterTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { StatusBadge, RowActions, RowAction } from './AdminTable';

const GestionMasterTable = () => {
  const { masterTableData, addRecord, updateRecord, deleteRecord, loading, error, refetch } = useMasterTable();

  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [expandedParents, setExpandedParents] = useState(new Set());

  const toggleExpand = (parentId) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const openModal = (data = null) => {
    setEditingData(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingData(null);
  };

  const handleSave = async (formData) => {
    try {
      if (editingData) {
        await updateRecord(editingData.idMasterTable, formData);
      } else {
        await addRecord(formData);
      }
      closeModal();
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = (idMasterTable) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      deleteRecord(idMasterTable).catch((err) => {
        alert('Error al eliminar: ' + err.message);
      });
    }
  };

  const getHierarchicalData = () => {
    return masterTableData.filter((item) => item.idMasterTableParent === null);
  };

  const getChildrenItems = (parentId) => {
    return masterTableData.filter((item) => item.idMasterTableParent === parentId);
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop pt-6 pb-12 max-w-container-max mx-auto w-full fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue">
            Gestión de Tabla Maestra
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Administra los datos maestros y configuraciones del sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            leadingIcon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
          >
            Recargar
          </Button>
          <Button
            variant="primary"
            onClick={() => openModal()}
            disabled={loading}
            leadingIcon={<Plus size={18} />}
          >
            Nuevo Registro
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-error/10 border-l-4 border-error !p-4 flex justify-between items-center">
          <span className="text-error font-body-md">⚠️ Error: {error}</span>
          <Button variant="outline" onClick={refetch}>Reintentar</Button>
        </Card>
      )}

      <Card className="w-full !p-0 overflow-hidden">
        {loading && masterTableData.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant">Cargando tabla maestra...</div>
        ) : masterTableData.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <p className="text-on-surface-variant mb-4">No hay registros en la tabla maestra</p>
            <Button variant="primary" onClick={() => openModal()} leadingIcon={<Plus size={18} />}>
              Crear primer registro
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-surface-container-highest">
                <tr>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">ID</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Nombre</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Descripción</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Valor</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Orden</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Creado por</th>
                  <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest font-body-md text-body-md">
                {getHierarchicalData().map((parentItem) => (
                  <React.Fragment key={parentItem.idMasterTable}>
                    <tr className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 text-on-surface-variant hover:text-trust-blue hover:bg-surface-container-highest rounded transition-colors"
                            onClick={() => toggleExpand(parentItem.idMasterTable)}
                          >
                            {expandedParents.has(parentItem.idMasterTable) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <span className="font-mono text-sm text-on-surface-variant">{parentItem.idMasterTable}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 font-semibold text-on-surface whitespace-nowrap">{parentItem.name}</td>
                      <td className="py-3 px-6 text-on-surface-variant">{parentItem.description}</td>
                      <td className="py-3 px-6 font-mono text-sm">{parentItem.value || '-'}</td>
                      <td className="py-3 px-6">{parentItem.order}</td>
                      <td className="py-3 px-6"><StatusBadge active={parentItem.state === 'A'} /></td>
                      <td className="py-3 px-6 text-on-surface-variant">{parentItem.userNew}</td>
                      <td className="py-3 px-6">
                        <RowActions>
                          <RowAction icon={Edit} label="Editar" onClick={() => openModal(parentItem)} disabled={loading} />
                          <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => handleDelete(parentItem.idMasterTable)} disabled={loading} />
                        </RowActions>
                      </td>
                    </tr>

                    {expandedParents.has(parentItem.idMasterTable) &&
                      getChildrenItems(parentItem.idMasterTable).map((childItem) => (
                        <tr key={childItem.idMasterTable} className="bg-surface-container-lowest/50 hover:bg-surface-container-lowest transition-colors">
                          <td className="py-2 px-6 whitespace-nowrap pl-12 font-mono text-sm text-on-surface-variant">
                            ↳ {childItem.idMasterTable}
                          </td>
                          <td className="py-2 px-6 text-on-surface whitespace-nowrap">{childItem.name}</td>
                          <td className="py-2 px-6 text-on-surface-variant">{childItem.description}</td>
                          <td className="py-2 px-6 font-mono text-sm">{childItem.value || '-'}</td>
                          <td className="py-2 px-6">{childItem.order}</td>
                          <td className="py-2 px-6"><StatusBadge active={childItem.state === 'A'} /></td>
                          <td className="py-2 px-6 text-on-surface-variant">{childItem.userNew}</td>
                          <td className="py-2 px-6">
                            <RowActions>
                              <RowAction icon={Edit} label="Editar" onClick={() => openModal(childItem)} disabled={loading} />
                              <RowAction icon={Trash2} label="Eliminar" variant="danger" onClick={() => handleDelete(childItem.idMasterTable)} disabled={loading} />
                            </RowActions>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <MasterTableModal
          isOpen={showModal}
          data={editingData}
          masterTableData={masterTableData}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default GestionMasterTable;
