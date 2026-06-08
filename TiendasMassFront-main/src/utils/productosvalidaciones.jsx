// productosvalidaciones.jsx - Validaciones del módulo de Productos

// 🛡️ Helper para detectar XSS
const containsXSS = (value) => {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /<body[\s\S]*?>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(value));
};

// ✅ 1. Nombre del Producto
const validateNombre = (value) => {
  if (!value || value.trim() === '') {
    return 'El nombre del producto es requerido';
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }
  
  if (value.length > 100) {
    return 'El nombre no puede superar los 100 caracteres';
  }
  
  // Detectar XSS
  if (containsXSS(value)) {
    return 'El nombre contiene caracteres no permitidos';
  }
  
  // Debe contener al menos una letra o número
  const contentRegex = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/;
  if (!contentRegex.test(value)) {
    return 'El nombre debe contener al menos letras o números';
  }
  
  return null;
};

// ✅ 2. Descripción
const validateDescripcion = (value) => {
  // Campo opcional - null o vacío es válido
  if (!value || value.trim() === '') {
    return null;
  }
  
  if (value.length > 500) {
    return 'La descripción no puede superar los 500 caracteres';
  }
  
  // Detectar XSS
  if (containsXSS(value)) {
    return 'La descripción contiene caracteres no permitidos';
  }
  
  return null;
};

// ✅ 3. Precio
const validatePrecio = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 'El precio es requerido';
  }
  
  // Convertir a string para validar
  const priceStr = String(value).trim();
  
  // Verificar que sea numérico con hasta 2 decimales
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  if (!priceRegex.test(priceStr)) {
    // Detectar si tiene más de 2 decimales
    if (/^\d+\.\d{3,}$/.test(priceStr)) {
      return 'El precio solo puede tener hasta 2 decimales';
    }
    return 'El precio debe ser un número válido';
  }
  
  const priceNum = parseFloat(priceStr);
  
  if (isNaN(priceNum)) {
    return 'El precio debe ser un número válido';
  }
  
  if (priceNum <= 0) {
    return 'El precio debe ser mayor a 0';
  }
  
  if (priceNum > 999999.99) {
    return 'El precio no puede superar $999,999.99';
  }
  
  return null;
};

// ✅ 4. Stock
const validateStock = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 'El stock es requerido';
  }
  
  // Convertir a string para validar
  const stockStr = String(value).trim();
  
  // Verificar que sea un número entero (sin decimales)
  if (!/^\d+$/.test(stockStr)) {
    // Detectar si tiene decimales
    if (/^\d+\.\d+$/.test(stockStr)) {
      return 'El stock debe ser un número entero';
    }
    // Detectar negativos
    if (/^-/.test(stockStr)) {
      return 'El stock no puede ser negativo';
    }
    return 'El stock debe ser un número válido';
  }
  
  const stockNum = parseInt(stockStr, 10);
  
  if (isNaN(stockNum)) {
    return 'El stock debe ser un número válido';
  }
  
  if (stockNum < 0) {
    return 'El stock no puede ser negativo';
  }
  
  if (stockNum > 999999) {
    return 'El stock no puede superar 999,999 unidades';
  }
  
  return null;
};

// ✅ 5. Marca
const validateMarca = (value) => {
  // Campo opcional - null o vacío es válido
  if (!value || value.trim() === '') {
    return null;
  }
  
  if (value.length > 50) {
    return 'La marca no puede superar los 50 caracteres';
  }
  
  // Solo letras, números, espacios y &, ., -, '
  const marcaRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s&.\-']+$/;
  if (!marcaRegex.test(value)) {
    return 'La marca contiene caracteres no válidos';
  }
  
  return null;
  return null;
};

// ✅ 6. Categoría
const validateCategoriaId = (value, categorias = []) => {
  if (value === '' || value === null || value === undefined) {
    return 'Debes seleccionar una categoría';
  }
  
  const catId = parseInt(value, 10);
  
  if (isNaN(catId) || catId <= 0) {
    return 'Categoría inválida';
  }
  
  // Validar que la categoría existe en la lista
  if (categorias.length > 0) {
    const categoriaExists = categorias.some(cat => cat.id === catId);
    if (!categoriaExists) {
      return 'La categoría seleccionada no existe';
    }
  }
  
  return null;
};

// ✅ 7. Imagen
const validateImagen = (file) => {
  // Campo opcional - null es válido
  if (!file || file === null) {
    return null;
  }
  
  // Verificar que sea un File object
  if (!(file instanceof File)) {
    return 'Archivo inválido';
  }
  
  // Tipos permitidos
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)';
  }
  
  // Tamaño mínimo: 1KB (1024 bytes)
  const minSize = 1024;
  if (file.size < minSize) {
    return 'La imagen es demasiado pequeña (mín. 1KB)';
  }
  
  // Tamaño máximo: 5MB (5,242,880 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'La imagen no puede superar los 5MB';
  }
  
  // NOTA: Las dimensiones se validan en handleImageChange del componente
  // porque require crear un objeto Image y es asíncrono
  
  return null;
};

// 🔧 Funciones Helper

// Validar todo el formulario de producto
const validateFormData = (formData, productos = [], categorias = [], excludeId = null) => {
  const errors = {};
  
  const nombreError = validateNombre(formData.nombre);
  if (nombreError) errors.nombre = nombreError;
  
  // Validar nombre duplicado
  if (!nombreError && checkDuplicate(productos, formData.nombre, excludeId)) {
    errors.nombre = 'Ya existe un producto con este nombre';
  }
  
  const descripcionError = validateDescripcion(formData.descripcion);
  if (descripcionError) errors.descripcion = descripcionError;
  
  const precioError = validatePrecio(formData.precio);
  if (precioError) errors.precio = precioError;
  
  const stockError = validateStock(formData.stock);
  if (stockError) errors.stock = stockError;
  
  const marcaError = validateMarca(formData.marca);
  if (marcaError) errors.marca = marcaError;
  
  const categoriaError = validateCategoriaId(formData.categoriaId, categorias);
  if (categoriaError) errors.categoriaId = categoriaError;
  
  const imagenError = validateImagen(formData.imagen);
  if (imagenError) errors.imagen = imagenError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Verificar si el stock está bajo
const checkLowStock = (stock, threshold = 10) => {
  const stockNum = parseInt(stock, 10);
  if (isNaN(stockNum)) return false;
  return stockNum > 0 && stockNum <= threshold;
};

// Buscar productos duplicados por nombre
const checkDuplicate = (products, nombre, excludeId = null) => {
  if (!nombre || !products) return false;
  
  const normalizedName = nombre.trim().toLowerCase();
  
  return products.some(product => {
    if (excludeId && product.id === excludeId) return false;
    return product.nombre?.trim().toLowerCase() === normalizedName;
  });
};

// Formatear precio a 2 decimales
const formatPrice = (price) => {
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) return '0.00';
  return priceNum.toFixed(2);
};

// Formatear stock como entero
const formatStock = (stock) => {
  const stockNum = parseInt(stock, 10);
  if (isNaN(stockNum)) return 0;
  return stockNum;
};

// Validar dimensiones de imagen (async)
const validateImageDimensions = (file) => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      const width = img.width;
      const height = img.height;
      
      if (width < 100 || height < 100) {
        resolve('La imagen es demasiado pequeña (mínimo 100x100 px)');
        return;
      }
      
      if (width > 4000 || height > 4000) {
        resolve('La imagen es demasiado grande (máximo 4000x4000 px)');
        return;
      }
      
      resolve(null);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('No se pudo cargar la imagen');
    };
    
    img.src = objectUrl;
  });
};

// Exportar objeto con todas las validaciones
export const productValidators = {
  nombre: validateNombre,
  descripcion: validateDescripcion,
  precio: validatePrecio,
  stock: validateStock,
  marca: validateMarca,
  categoriaId: validateCategoriaId,
  imagen: validateImagen,
  validateForm: validateFormData,
  checkLowStock,
  checkDuplicate,
  formatPrice,
  formatStock,
  validateImageDimensions
};

// Exportaciones individuales para compatibilidad
export { 
  validateNombre,
  validateDescripcion,
  validatePrecio,
  validateStock,
  validateMarca,
  validateCategoriaId,
  validateImagen,
  validateFormData as validateForm,
  checkLowStock,
  checkDuplicate,
  formatPrice,
  formatStock,
  validateImageDimensions
};
