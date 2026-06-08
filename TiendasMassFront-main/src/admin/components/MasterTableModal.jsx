import React, { useState, useEffect } from 'react';
import { X as CloseIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const MasterTableModal = ({ isOpen, data, masterTableData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    idMasterTableParent: null,
    value: '',
    description: '',
    name: '',
    order: 0,
    additionalOne: '–',
    additionalTwo: '–',
    additionalThree: '–',
    state: 'A'
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        idMasterTableParent: null,
        value: '',
        description: '',
        name: '',
        order: 0,
        additionalOne: '–',
        additionalTwo: '–',
        additionalThree: '–',
        state: 'A'
      });
    }
  }, [data, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order' || name === 'idMasterTableParent' ? (value ? parseInt(value) : null) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const parentOptions = masterTableData.filter((item) => item.idMasterTableParent === null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-tint/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col !p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface sticky top-0 z-10">
          <h3 className="font-headline-md text-headline-md text-trust-blue">
            {data ? 'Editar Registro' : 'Nuevo Registro'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-error transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-surface">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre *"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Sexo, TipoDocumento"
                required
              />

              <Input
                label="Descripción *"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ej: Sexo colaborador"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-label-bold text-label-bold text-on-surface">Tabla Padre (opcional)</label>
                <select
                  name="idMasterTableParent"
                  className="w-full bg-surface border-2 border-outline-variant focus:border-trust-blue outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface min-h-[44px]"
                  value={formData.idMasterTableParent || ''}
                  onChange={handleChange}
                >
                  <option value="">-- Ninguno (es tabla principal) --</option>
                  {parentOptions.map((item) => (
                    <option key={item.idMasterTable} value={item.idMasterTable}>
                      {item.idMasterTable} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Valor"
                type="text"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder="Ej: M, DNI, PT"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Orden"
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
              />

              <div className="flex flex-col gap-1">
                <label className="font-label-bold text-label-bold text-on-surface">Estado</label>
                <select
                  name="state"
                  className="w-full bg-surface border-2 border-outline-variant focus:border-trust-blue outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface min-h-[44px]"
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="A">Activo</option>
                  <option value="I">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Adicional 1"
                type="text"
                name="additionalOne"
                value={formData.additionalOne}
                onChange={handleChange}
              />

              <Input
                label="Adicional 2"
                type="text"
                name="additionalTwo"
                value={formData.additionalTwo}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Adicional 3"
                type="text"
                name="additionalThree"
                value={formData.additionalThree}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {data ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MasterTableModal;
