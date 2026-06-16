import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, Plus, Filter, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { formatPrice } from '../../utils/productosvalidaciones';

const API_URL = "http://localhost:5001/api/kardex";
const PRODUCT_API_URL = "http://localhost:5001/api/products";

const GestionKardex = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    tipo_movimiento: 'ENTRADA',
    cantidad: '',
    motivo: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kardexRes, productosRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(PRODUCT_API_URL)
      ]);
      setMovimientos(kardexRes.data);
      // Para admin, la API ahora devuelve array (retrocompatibilidad) o si tuviera paginación, sacamos data
      const prodData = productosRes.data.data || productosRes.data;
      setProductos(prodData);
    } catch (error) {
      console.error('Error al cargar kardex:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.producto_id || !formData.cantidad || !formData.motivo) {
        Swal.fire('Atención', 'Todos los campos son obligatorios', 'warning');
        return;
      }

      await axios.post(API_URL, {
        ...formData,
        cantidad: parseInt(formData.cantidad, 10)
      });

      Swal.fire('Éxito', 'Movimiento registrado correctamente', 'success');
      setShowModal(false);
      setFormData({
        producto_id: '',
        tipo_movimiento: 'ENTRADA',
        cantidad: '',
        motivo: '',
      });
      fetchData(); // Refrescar historial
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      Swal.fire('Error', error.response?.data?.message || 'Error al registrar el movimiento', 'error');
    }
  };

  const filteredMovimientos = movimientos.filter(mov => {
    const pName = mov.producto?.nombre?.toLowerCase() || '';
    const sTerm = searchTerm.toLowerCase();
    
    const matchesSearch = pName.includes(sTerm) || mov.motivo.toLowerCase().includes(sTerm);
    const matchesTipo = filtroTipo === '' || mov.tipo_movimiento === filtroTipo;
    const matchesProducto = filtroProducto === '' || mov.producto?.id?.toString() === filtroProducto;

    return matchesSearch && matchesTipo && matchesProducto;
  });

  const formatFecha = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('es-PE', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute:'2-digit'
    });
  };

  const getTipoBadgeClass = (tipo) => {
    if (tipo === 'ENTRADA') return 'bg-success/20 text-success';
    if (tipo === 'SALIDA') return 'bg-error/20 text-error';
    return 'bg-mass-yellow/20 text-mass-yellow-dark';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-trust-blue flex items-center gap-2">
            <Package className="w-6 h-6" />
            Control de Inventario (Kardex)
          </h2>
          <p className="text-on-surface-variant">Registra entradas, salidas y ajustes de stock.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-trust-blue text-white hover:bg-trust-blue-dark">
          <Plus className="w-5 h-5" />
          Registrar Movimiento
        </Button>
      </div>

      <Card className="p-4 sm:p-6 bg-surface shadow-level-1 border border-surface-container-highest rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por producto o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-container-highest rounded-xl focus:ring-2 focus:ring-trust-blue focus:border-trust-blue transition-all"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-4">
            <div className="w-full sm:w-auto min-w-[200px]">
              <select
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-container-highest rounded-xl focus:ring-2 focus:ring-trust-blue"
              >
                <option value="">Todos los Productos</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-container-highest rounded-xl focus:ring-2 focus:ring-trust-blue"
              >
                <option value="">Todos los Tipos</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SALIDA">Salidas</option>
                <option value="AJUSTE">Ajustes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-container-highest">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-surface-container-highest">
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface">Fecha</th>
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface">Producto</th>
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface">Tipo</th>
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface text-center">Cantidad</th>
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface text-center">Stock Anterior</th>
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface text-center">Stock Nuevo</th>
                <th className="px-6 py-4 text-label-lg font-bold text-on-surface">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-on-surface-variant">Cargando movimientos...</td>
                </tr>
              ) : filteredMovimientos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-on-surface-variant">No se encontraron movimientos.</td>
                </tr>
              ) : (
                filteredMovimientos.map((mov) => (
                  <tr key={mov.id} className="border-b border-surface-container-highest hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 text-body-md text-on-surface-variant whitespace-nowrap">
                      {formatFecha(mov.creadoEn)}
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface font-medium">
                      {mov.producto?.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getTipoBadgeClass(mov.tipo_movimiento)}`}>
                        {mov.tipo_movimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-md text-center font-bold">
                      {mov.tipo_movimiento === 'ENTRADA' ? '+' : mov.tipo_movimiento === 'SALIDA' ? '-' : ''}
                      {mov.cantidad}
                    </td>
                    <td className="px-6 py-4 text-body-md text-center text-on-surface-variant">{mov.stock_anterior}</td>
                    <td className="px-6 py-4 text-body-md text-center font-bold text-trust-blue">{mov.stock_nuevo}</td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{mov.motivo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL REGISTRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl shadow-level-3 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-container-highest bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-xl font-bold text-trust-blue">Registrar Movimiento</h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error transition-colors text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Producto *</label>
                <select
                  name="producto_id"
                  value={formData.producto_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-container-highest rounded-xl focus:ring-2 focus:ring-trust-blue"
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Tipo de Movimiento *</label>
                <select
                  name="tipo_movimiento"
                  value={formData.tipo_movimiento}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-container-highest rounded-xl focus:ring-2 focus:ring-trust-blue"
                >
                  <option value="ENTRADA">ENTRADA (Añadir stock)</option>
                  <option value="SALIDA">SALIDA (Reducir stock)</option>
                  <option value="AJUSTE">AJUSTE (Establecer nuevo stock exacto)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">
                  {formData.tipo_movimiento === 'AJUSTE' ? 'Nuevo Stock Exacto *' : 'Cantidad *'}
                </label>
                <Input
                  type="number"
                  name="cantidad"
                  min="0"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  placeholder={formData.tipo_movimiento === 'AJUSTE' ? 'Ej. 100' : 'Ej. 10'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Motivo / Justificación *</label>
                <textarea
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  placeholder="Ej. Ingreso por compra a proveedor"
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-container-highest rounded-xl focus:ring-2 focus:ring-trust-blue"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-surface-container-high text-on-surface hover:bg-surface-container-highest">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-trust-blue text-white hover:bg-trust-blue-dark">
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionKardex;
