// metodospagovalidaciones.jsx - Validaciones del módulo de Métodos de Pago

/**
 * Validador de Nombre del Método de Pago
 * CV1: Texto entre 3 y 100 caracteres, usando letras, números, espacios, guion o guion bajo
 * @param {string} value - Valor a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateNombre = (value) => {
  // Validar que no esté vacío
  if (!value || value.trim() === '') {
    return 'El nombre del método de pago es requerido';
  }

  const trimmedValue = value.trim();

  // CI2: Menos de 3 caracteres
  if (trimmedValue.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }

  // CI3: Más de 100 caracteres
  if (trimmedValue.length > 100) {
    return 'El nombre no puede exceder 100 caracteres';
  }

  // CI4: Solo espacios en blanco (ya validado con trim)
  
  // CI5: Contiene caracteres no permitidos (@, %, /, ?, #)
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/;
  if (!nombreRegex.test(trimmedValue)) {
    return 'El nombre solo puede contener letras, números, espacios, guiones y guión bajo';
  }

  return null;
};

/**
 * Validador de Descripción del Método de Pago
 * CV7-8: Opcional, texto entre 10 y 500 caracteres
 * @param {string} value - Valor a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateDescripcion = (value) => {
  // CV7: Vacía (campo opcional)
  if (!value || value.trim() === '') {
    return null; // Es válido estar vacío
  }

  const trimmedValue = value.trim();

  // CI9: Menos de 10 caracteres
  if (trimmedValue.length < 10) {
    return 'La descripción debe tener al menos 10 caracteres';
  }

  // CI10: Más de 500 caracteres
  if (value.length > 500) {
    return 'La descripción no puede exceder 500 caracteres';
  }

  // CI11: Solo espacios o símbolos repetidos sin significado
  if (/^[\s\W]+$/.test(trimmedValue)) {
    return 'La descripción debe contener texto válido';
  }

  return null;
};

/**
 * Validador de Comisión (%)
 * CV12: Número real o entero entre 0 y 100 (inclusive)
 * @param {string|number} value - Valor a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateComision = (value) => {
  // CI15: Campo vacío o nulo
  if (value === '' || value === null || value === undefined) {
    return 'La comisión es requerida';
  }

  // CI16: Texto o símbolo no numérico
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return 'La comisión debe ser un número válido';
  }

  // CI13: Valor negativo
  if (numValue < 0) {
    return 'La comisión no puede ser negativa';
  }

  // CI14: Valor mayor a 100
  if (numValue > 100) {
    return 'La comisión no puede exceder 100%';
  }

  // CV12: Validar que es un número válido entre 0 y 100
  return null;
};

/**
 * Validador completo del formulario de Métodos de Pago
 * @param {Object} formData - Datos del formulario
 * @returns {Object} - Objeto con errores por campo
 */
export const validateForm = (formData) => {
  const errors = {};

  // Validar nombre
  const nombreError = validateNombre(formData.nombre);
  if (nombreError) {
    errors.nombre = nombreError;
  }

  // Validar descripción
  const descripcionError = validateDescripcion(formData.descripcion);
  if (descripcionError) {
    errors.descripcion = descripcionError;
  }

  // Validar comisión
  const comisionError = validateComision(formData.comision);
  if (comisionError) {
    errors.comision = comisionError;
  }

  return errors;
};

/**
 * Validador de campo individual
 * @param {string} fieldName - Nombre del campo
 * @param {any} value - Valor a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case 'nombre':
      return validateNombre(value);
    case 'descripcion':
      return validateDescripcion(value);
    case 'comision':
      return validateComision(value);
    default:
      return null;
  }
};

/**
 * Verificar si un nombre de método de pago ya existe
 * @param {string} nombre - Nombre a verificar
 * @param {Array} metodosPago - Lista de métodos de pago existentes
 * @param {number|null} currentId - ID del método actual (en caso de edición)
 * @returns {boolean} - true si el nombre ya existe
 */
export const checkDuplicateName = (nombre, metodosPago = [], currentId = null) => {
  if (!nombre || !Array.isArray(metodosPago)) return false;

  const normalizedName = nombre.trim().toLowerCase();
  
  return metodosPago.some(metodo => 
    metodo.nombre.toLowerCase() === normalizedName && 
    (!currentId || metodo.id !== currentId)
  );
};

/**
 * Formatear el valor de comisión para mostrar
 * @param {number} comision - Valor de comisión
 * @returns {string} - Comisión formateada
 */
export const formatComision = (comision) => {
  const num = parseFloat(comision);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};
