import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Plus, Search, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import swal from 'sweetalert2';
import {
  validateNombre,
  validateDescripcion,
  validatePrecio,
  validateStock,
  validateMarca,
  validateCategoriaId,
  validateImagen,
  validateForm,
  checkLowStock,
  checkDuplicate,
  formatPrice,
  formatStock,
  validateImageDimensions
} from '../../utils/productosvalidaciones';
import SubcategoriaSelector from '../../components/SubcategoriaSelector';
import SubcategoriasMultiples from '../../components/SubcategoriasMultiples';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
//import { mockProducts, mockCategories } from '../../data/mockData.jsx';
const URL = "http://localhost:5001";
const PLACEHOLDER_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'><rect width='50' height='50' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='8' fill='%239ca3af'>Sin imagen</text></svg>";
const ProductManager = () => {

  const API_URL = `${URL}/api/products`;
  const CATEGORY_URL = `${URL}/api/categorias`;

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [productsPerPage, setProductsPerPage] = useState(10);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productosRes, categoriasRes] = await Promise.all([
          axios.get(API_URL),
          axios.get(CATEGORY_URL),
          
        ]);

        setProducts(productosRes.data);
        console.log('📦 Productos recibidos:', productosRes.data);
        setCategorias(categoriasRes.data);
        setError('');
      } catch (error) {
        swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los datos. Por favor, recarga la página.',
        });
        setError('Error al cargar los datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoriaId: '',
    subcategoriaIds: [], // Cambiar a array
    stock: '',
    marca: '',
    imagen: null,
    estado: true,
  });

  const filteredProducts = products.filter(product => {
    const nombre = product.nombre || '';
    const descripcion = product.descripcion || '';

    const matchesSearch =
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === '' ||
      product.categoria?.id?.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });


  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio.toString(),
      stock: product.stock.toString(),
      marca: product.marca || '',
      imagen: null,
      categoriaId: product.categoria?.id?.toString() || '',
      subcategoriaIds: product.subcategoria_ids || [], // Cambiar a array
      estado: product.estado?.nombre === 'Activo',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      categoriaId: '',
      subcategoriaIds: [], // Cambiar a array
      stock: '',
      marca: '',
      imagen: null,
      estado: true,
    });
    setErrors({});
    setShowModal(true);
  };

  // Función para validar campo individual
  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // Validar el campo individual
    let fieldError = null;
    switch (field) {
      case 'nombre':
        fieldError = validateNombre(value);
        // Verificar nombre duplicado
        if (!fieldError && checkDuplicate(products, value, editingProduct?.id)) {
          fieldError = 'Ya existe un producto con este nombre';
        }
        break;
      case 'descripcion':
        fieldError = validateDescripcion(value);
        break;
      case 'precio':
        fieldError = validatePrecio(value);
        break;
      case 'stock':
        fieldError = validateStock(value);
        break;
      case 'marca':
        fieldError = validateMarca(value);
        break;
      case 'categoriaId':
        fieldError = validateCategoriaId(value, categorias);
        break;
      default:
        break;
    }

    // Actualizar errores
    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldError) {
        newErrors[field] = fieldError;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario completo con productos, categorías y ID a excluir
    const validation = validateForm(formData, products, categorias, editingProduct?.id);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      swal.fire({
        icon: 'error',
        title: 'Errores en el formulario',
        text: 'Por favor corrige los errores antes de continuar',
      });
      return;
    }

    // Validar imagen si es nueva (incluye dimensiones)
    if (formData.imagen && formData.imagen instanceof File) {
      const imageError = validateImagen(formData.imagen);
      if (imageError) {
        setErrors({ ...errors, imagen: imageError });
        return;
      }
      
      // Validar dimensiones
      const dimensionError = await validateImageDimensions(formData.imagen);
      if (dimensionError) {
        setErrors({ ...errors, imagen: dimensionError });
        swal.fire({
          icon: 'error',
          title: 'Error en la imagen',
          text: dimensionError,
        });
        return;
      }
    }

    // Advertencia de stock bajo
    if (checkLowStock(parseInt(formData.stock))) {
      const result = await swal.fire({
        icon: 'warning',
        title: 'Advertencia de stock',
        text: `El stock es bajo (${formData.stock} unidades). ¿Deseas continuar?`,
        showCancelButton: true,
        confirmButtonText: 'Continuar de todas formas',
        cancelButtonText: 'Cancelar',
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }

    const form = new FormData();
    form.append('nombre', formData.nombre.trim());
    form.append('descripcion', formData.descripcion.trim());
    form.append('precio', formatPrice(formData.precio));
    form.append('stock', formatStock(formData.stock));
    form.append('marca', formData.marca.trim() || '');
    form.append('categoria_id', formData.categoriaId);
    
    // Enviar múltiples subcategorías
    if (Array.isArray(formData.subcategoriaIds) && formData.subcategoriaIds.length > 0) {
      form.append('subcategoria_ids', JSON.stringify(formData.subcategoriaIds));
    } else {
      form.append('subcategoria_ids', JSON.stringify([]));
    }
    
    form.append('estado', formData.estado.toString());

    if (formData.imagen) {
      console.log('📸 Archivo seleccionado:', formData.imagen);
      form.append('imagen', formData.imagen);
    }

    // Debug: ver qué datos se están enviando
    console.log('📤 Datos a enviar:');
    for (let [key, value] of form.entries()) {
      console.log(key, value);
    }

    try {
      setLoading(true);
      if (editingProduct) {
        const response = await axios.put(`${API_URL}/${editingProduct.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Actualizar la lista de productos
        setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
        swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Producto actualizado exitosamente',
        });
      } else {
        const res = await axios.post(API_URL, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts([res.data, ...products]);
        swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Producto creado exitosamente',
        });
      }
      setShowModal(false);
      setErrors({});
      setError('');
    } catch (error) {
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al guardar el producto. Por favor, intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    const result = await swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de eliminar este producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/${id}`);
        setProducts(products.filter(p => p.id !== id));
        swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Producto eliminado exitosamente',
        });
        setError('');
      } catch (error) {
        swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el producto. Por favor, intenta de nuevo.',
        });
      } finally {
        setLoading(false);
      }
    }
  };


  const toggleActive = async (product) => {
    try {
      setLoading(true);
      // Cambiar estado: si está Activo (ID 1), cambiar a Inactivo (ID 2) y viceversa
      const newEstadoId = product.estado?.id === 1 ? 2 : 1;
      
      const response = await axios.put(`${API_URL}/${product.id}`, {
        estado: newEstadoId
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      setProducts(products.map(p => p.id === product.id ? response.data : p));
      setError('');
      
      swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El producto ha sido ${newEstadoId === 1 ? 'activado' : 'desactivado'}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al cambiar el estado del producto',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo y tamaño primero
      const imageError = validateImagen(file);
      if (imageError) {
        swal.fire({
          icon: 'error',
          title: 'Error en la imagen',
          text: imageError,
        });
        e.target.value = '';
        return;
      }
      
      // Validar dimensiones (asíncrono)
      const dimensionError = await validateImageDimensions(file);
      if (dimensionError) {
        swal.fire({
          icon: 'error',
          title: 'Error en las dimensiones',
          text: dimensionError,
        });
        e.target.value = '';
        return;
      }
      
      setFormData({ ...formData, imagen: file });
    }
  };

  const isActive = (product) => product.estado?.nombre === 'Activo';
  const isLowStock = (stock) => stock <= 10;
  const formatSoles = (n) =>
    `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '400px' }}>
        <div className="w-12 h-12 border-4 border-trust-blue border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-body-md text-body-md text-on-surface-variant">Cargando productos...</p>
      </div>
    );
  }

  const totalItems = filteredProducts.length;
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + productsPerPage, totalItems);

  return (
    <div className="bg-surface-grey min-h-screen px-margin-mobile md:px-margin-desktop py-8">
      <div className="max-w-container-max mx-auto flex flex-col gap-6">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-1">
              Gestión de Productos
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Administra el catálogo, precios y niveles de stock del minimarket.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                size={18}
              />
              <input
                type="text"
                className="w-full bg-surface border-2 border-transparent focus:border-trust-blue rounded-lg pl-10 pr-4 py-2 min-h-[44px] outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 shadow-sm transition-all"
                placeholder="Buscar SKU o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-surface border-2 border-transparent focus:border-trust-blue rounded-lg px-4 py-2 min-h-[44px] outline-none font-body-md text-body-md text-on-surface shadow-sm transition-all cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              className="shrink-0 min-h-[44px]"
              onClick={handleAdd}
              disabled={loading}
              leadingIcon={<Plus size={18} />}
            >
              Agregar Producto
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container font-body-md text-body-md rounded-lg px-4 py-3 border border-error/20">
            {error}
          </div>
        )}

        {/* Bento-style product grid */}
        <div className="flex flex-col gap-3">
          {/* Column Headers (Desktop) */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 border-b border-outline-variant/30 font-label-bold text-label-bold text-on-surface-variant">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Stock / Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {currentProducts.length === 0 ? (
            <div className="bg-surface rounded-xl p-12 text-center shadow-[0_4px_16px_rgba(0,51,160,0.04)]">
              <p className="font-body-md text-body-md text-on-surface-variant">
                No se encontraron productos.
              </p>
            </div>
          ) : (
            currentProducts.map((product) => {
              const active = isActive(product);
              const low = isLowStock(product.stock);
              return (
                <div
                  key={product.id}
                  className={`bg-surface rounded-xl p-4 lg:px-6 shadow-[0_4px_16px_rgba(0,51,160,0.04)] hover:shadow-md transition-all grid grid-cols-1 lg:grid-cols-12 gap-4 items-center group ${
                    !active ? 'opacity-75' : ''
                  }`}
                >
                  {/* Product details */}
                  <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-lg bg-surface-grey shrink-0 overflow-hidden border border-outline-variant/10 ${
                        !active ? 'grayscale' : ''
                      }`}
                    >
                      <img
                        src={product.imagen ? `${URL}/${product.imagen}` : PLACEHOLDER_IMG}
                        alt={product.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (e.target.src === PLACEHOLDER_IMG) return;
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDER_IMG;
                        }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`font-headline-md text-headline-md text-on-surface text-lg leading-tight truncate ${
                          !active ? 'line-through text-on-surface-variant' : ''
                        }`}
                      >
                        {product.nombre}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface-variant text-sm truncate">
                        {product.descripcion || `SKU: ${product.id}`}
                      </span>
                      {product.marca && (
                        <span className="font-label-bold text-label-bold text-on-surface-variant text-xs mt-0.5">
                          {product.marca}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-1 lg:col-span-2 flex flex-wrap items-center gap-1">
                    <span className="bg-surface-container-high text-on-surface font-label-bold text-label-bold px-3 py-1 rounded-md text-xs uppercase tracking-wider">
                      {product.categoria ? product.categoria.nombre : 'Sin categoría'}
                    </span>
                    {product.subcategorias && product.subcategorias.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 w-full">
                        {product.subcategorias.map((sub) => (
                          <span
                            key={sub.id}
                            className="bg-secondary-fixed text-on-secondary-container font-label-bold text-[10px] px-2 py-0.5 rounded"
                          >
                            {sub.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="col-span-1 lg:col-span-2 flex items-center">
                    {active ? (
                      <div className="bg-mass-yellow px-2 py-1 rounded">
                        <span className="font-headline-md text-headline-md text-on-surface text-xl">
                          {formatSoles(product.precio)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-headline-md text-headline-md text-on-surface-variant text-xl">
                        {formatSoles(product.precio)}
                      </span>
                    )}
                  </div>

                  {/* Stock + Status */}
                  <div className="col-span-1 lg:col-span-2 flex flex-col gap-1 items-start">
                    {low ? (
                      <span className="font-label-bold text-label-bold text-sale-red flex items-center gap-1">
                        <AlertTriangle size={16} /> {product.stock} unidades
                      </span>
                    ) : (
                      <span
                        className={`font-label-bold text-label-bold flex items-center gap-1 ${
                          active ? 'text-on-surface' : 'text-on-surface-variant'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            active ? 'bg-trust-blue' : 'bg-outline'
                          }`}
                        />
                        {product.stock} unidades
                      </span>
                    )}
                    <button
                      onClick={() => toggleActive(product)}
                      disabled={loading}
                      className={`font-label-bold text-label-bold text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        active
                          ? 'bg-secondary-fixed text-trust-blue hover:bg-secondary-container'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 lg:col-span-2 flex items-center lg:justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/20 mt-2 lg:mt-0">
                    <button
                      aria-label="Ver"
                      title="Ver"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-trust-blue transition-colors"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      aria-label="Editar"
                      title="Editar"
                      onClick={() => handleEdit(product)}
                      disabled={loading}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-trust-blue transition-colors disabled:opacity-50"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      aria-label="Eliminar"
                      title="Eliminar"
                      onClick={() => handleDelete(product.id)}
                      disabled={loading}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="bg-surface-container-low px-6 py-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-outline-variant/30">
          <div className="flex items-center gap-4 text-on-surface-variant font-body-md">
            <span>
              Mostrando {showingFrom}-{showingTo} de {totalItems} productos
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Mostrar:</span>
              <select
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface border border-outline-variant rounded px-2 py-1 outline-none focus:border-trust-blue text-sm transition-colors cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Anterior"
              className="w-10 h-10 rounded-lg bg-surface border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:text-trust-blue hover:bg-surface-container-high disabled:opacity-50 disabled:hover:bg-surface transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-label-bold text-label-bold text-on-surface px-4">
              {currentPage} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Siguiente"
              className="w-10 h-10 rounded-lg bg-surface border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:text-trust-blue hover:bg-surface-container-high disabled:opacity-50 disabled:hover:bg-surface transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-tint/40 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-3xl !p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant bg-surface flex justify-between items-center sticky top-0 z-10">
              <h2 className="font-headline-md text-headline-md text-trust-blue">
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              <button
                type="button"
                className="text-on-surface-variant hover:text-error transition-colors p-2"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre *"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  error={errors.nombre}
                  disabled={loading}
                  required
                />
                
                <div className="flex flex-col gap-1">
                  <label className="font-label-bold text-label-bold text-on-surface">Categoría *</label>
                  <select
                    className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface ${
                      errors.categoriaId ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
                    }`}
                    value={formData.categoriaId}
                    onChange={(e) => {
                      handleFieldChange('categoriaId', e.target.value);
                      setFormData({ ...formData, categoriaId: e.target.value, subcategoriaIds: [] });
                    }}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.categoriaId && <span className="font-label-md text-error mt-1">{errors.categoriaId}</span>}
                </div>
              </div>

              <div className="w-full">
                <SubcategoriasMultiples 
                  categoriaId={formData.categoriaId}
                  selectedIds={formData.subcategoriaIds}
                  onChange={(subcategoriaIds) => setFormData({ ...formData, subcategoriaIds })}
                  disabled={loading}
                  showLabel={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Marca"
                  type="text"
                  value={formData.marca}
                  onChange={(e) => handleFieldChange('marca', e.target.value)}
                  placeholder="Ej: La Favorita, Nestlé, etc."
                  error={errors.marca}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-bold text-label-bold text-on-surface">Descripción</label>
                <textarea
                  className={`w-full bg-surface border-2 outline-none transition-colors rounded-lg py-sm px-md font-body-md text-body-md text-on-surface min-h-[100px] resize-y ${
                    errors.descripcion ? 'border-error focus:border-error' : 'border-outline-variant focus:border-trust-blue'
                  }`}
                  value={formData.descripcion}
                  onChange={(e) => handleFieldChange('descripcion', e.target.value)}
                  disabled={loading}
                />
                {errors.descripcion && <span className="font-label-md text-error mt-1">{errors.descripcion}</span>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <Input
                  label="Precio *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={(e) => handleFieldChange('precio', e.target.value)}
                  error={errors.precio}
                  disabled={loading}
                  required
                />

                <Input
                  label="Stock *"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleFieldChange('stock', e.target.value)}
                  error={errors.stock}
                  disabled={loading}
                  required
                />

                <div className="flex flex-col gap-1">
                  <label className="font-label-bold text-label-bold text-on-surface">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-body-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-surface-container-high file:text-trust-blue hover:file:bg-surface-container-highest cursor-pointer disabled:opacity-50"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                  <small className="text-on-surface-variant text-[11px] mt-1">Máximo 5MB. Formatos: JPG, PNG, WEBP</small>
                </div>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer mt-2 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline-variant text-trust-blue focus:ring-trust-blue cursor-pointer disabled:opacity-50"
                  checked={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                  disabled={loading}
                />
                <span className="font-label-bold text-label-bold text-on-surface">Producto activo (visible en tienda)</span>
              </label>
            </form>

            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductManager;