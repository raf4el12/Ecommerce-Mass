// ========================================
// VALIDACIONES PARA DIRECCIONES DE USUARIO
// ========================================

// Validación de Nombre de Dirección (etiqueta)
export const validateNombreDireccion = (value) => {
  if (!value || value.trim() === '') {
    return 'El nombre de la dirección es requerido';
  }
  
  if (value.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (value.length > 50) {
    return 'El nombre no puede exceder 50 caracteres';
  }
  
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/;
  if (!nameRegex.test(value)) {
    return 'El nombre solo puede contener letras, números y espacios';
  }
  
  return null;
};

// Validación de Calle
export const validateCalle = (value) => {
  if (!value || value.trim() === '') {
    return 'La calle es requerida';
  }
  
  if (value.trim().length < 5) {
    return 'La calle debe tener al menos 5 caracteres';
  }
  
  if (value.length > 200) {
    return 'La calle no puede exceder 200 caracteres';
  }
  
  return null;
};

// Validación de Ciudad
export const validateCiudad = (value) => {
  if (!value || value.trim() === '') {
    return 'La ciudad es requerida';
  }
  
  if (value.trim().length < 2) {
    return 'La ciudad debe tener al menos 2 caracteres';
  }
  
  if (value.length > 100) {
    return 'La ciudad no puede exceder 100 caracteres';
  }
  
  const cityRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!cityRegex.test(value)) {
    return 'La ciudad solo puede contener letras y espacios';
  }
  
  return null;
};

// Validación de Código Postal
export const validateCodigoPostal = (value) => {
  if (!value || value.trim() === '') {
    return 'El código postal es requerido';
  }
  
  if (value.length < 4) {
    return 'El código postal debe tener al menos 4 caracteres';
  }
  
  if (value.length > 10) {
    return 'El código postal no puede exceder 10 caracteres';
  }
  
  const postalCodeRegex = /^[a-zA-Z0-9\s\-]+$/;
  if (!postalCodeRegex.test(value)) {
    return 'El código postal solo puede contener letras, números, espacios y guiones';
  }
  
  return null;
};

// Validación de País (opcional, puede ser fijo)
export const validatePais = (value) => {
  if (!value || value.trim() === '') {
    return null; // Es opcional o tiene valor por defecto
  }
  
  if (value.trim().length < 2) {
    return 'El país debe tener al menos 2 caracteres';
  }
  
  if (value.length > 100) {
    return 'El país no puede exceder 100 caracteres';
  }
  
  return null;
};

// Validación de Referencia (opcional)
export const validateReferencia = (value) => {
  if (!value || value.trim() === '') {
    return null; // Es opcional
  }
  
  if (value.length > 200) {
    return 'La referencia no puede exceder 200 caracteres';
  }
  
  return null;
};

// Validación completa del formulario de dirección
export const validateDireccionForm = (formData) => {
  const errors = {};
  
  const nombreError = validateNombreDireccion(formData.nombre);
  if (nombreError) errors.nombre = nombreError;
  
  const calleError = validateCalle(formData.calle);
  if (calleError) errors.calle = calleError;
  
  const ciudadError = validateCiudad(formData.ciudad);
  if (ciudadError) errors.ciudad = ciudadError;
  
  const codigoPostalError = validateCodigoPostal(formData.codigoPostal);
  if (codigoPostalError) errors.codigoPostal = codigoPostalError;
  
  const paisError = validatePais(formData.pais);
  if (paisError) errors.pais = paisError;
  
  const referenciaError = validateReferencia(formData.referencia);
  if (referenciaError) errors.referencia = referenciaError;
  
  return errors;
};

// Validar un campo individual
export const validateField = (fieldName, value, formData) => {
  switch (fieldName) {
    case 'nombre':
      return validateNombreDireccion(value);
    case 'calle':
      return validateCalle(value);
    case 'ciudad':
      return validateCiudad(value);
    case 'codigoPostal':
      return validateCodigoPostal(value);
    case 'pais':
      return validatePais(value);
    case 'referencia':
      return validateReferencia(value);
    default:
      return null;
  }
};
