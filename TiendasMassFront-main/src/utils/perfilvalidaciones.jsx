// ========================================
// VALIDACIONES PARA PERFIL DE USUARIO
// ========================================

// Validación de Nombre
export const validateNombre = (value) => {
  if (!value || value.trim() === '') {
    return 'El nombre es requerido';
  }
  
  if (value.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (value.length > 100) {
    return 'El nombre no puede exceder 100 caracteres';
  }
  
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(value)) {
    return 'El nombre solo puede contener letras y espacios';
  }
  
  return null;
};

// Validación de Teléfono (Opcional)
export const validateTelefono = (value) => {
  if (!value || value.trim() === '') {
    return null; // Es opcional
  }
  
  if (value.length < 7) {
    return 'El teléfono debe tener al menos 7 caracteres';
  }
  
  if (value.length > 15) {
    return 'El teléfono no puede exceder 15 caracteres';
  }
  
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  if (!phoneRegex.test(value)) {
    return 'El teléfono solo puede contener números, espacios, + y guiones';
  }
  
  return null;
};

// Validación de Ciudad (Opcional)
export const validateCiudad = (value) => {
  if (!value || value.trim() === '') {
    return null; // Es opcional
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

// Validación de Dirección (Opcional)
export const validateDireccion = (value) => {
  if (!value || value.trim() === '') {
    return null; // Es opcional
  }
  
  if (value.trim().length < 5) {
    return 'La dirección debe tener al menos 5 caracteres';
  }
  
  if (value.length > 200) {
    return 'La dirección no puede exceder 200 caracteres';
  }
  
  return null;
};

// Validación de Código Postal (Opcional)
export const validateCodigoPostal = (value) => {
  if (!value || value.trim() === '') {
    return null; // Es opcional
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

// Validación completa del formulario de perfil
export const validatePerfilForm = (formData) => {
  const errors = {};
  
  const nombreError = validateNombre(formData.nombre);
  if (nombreError) errors.nombre = nombreError;
  
  const telefonoError = validateTelefono(formData.telefono);
  if (telefonoError) errors.telefono = telefonoError;
  
  const ciudadError = validateCiudad(formData.ciudad);
  if (ciudadError) errors.ciudad = ciudadError;
  
  const direccionError = validateDireccion(formData.direccion);
  if (direccionError) errors.direccion = direccionError;
  
  const codigoPostalError = validateCodigoPostal(formData.codigoPostal);
  if (codigoPostalError) errors.codigoPostal = codigoPostalError;
  
  return errors;
};

// Validar un campo individual
export const validateField = (fieldName, value, formData) => {
  switch (fieldName) {
    case 'nombre':
      return validateNombre(value);
    case 'telefono':
      return validateTelefono(value);
    case 'ciudad':
      return validateCiudad(value);
    case 'direccion':
      return validateDireccion(value);
    case 'codigoPostal':
      return validateCodigoPostal(value);
    default:
      return null;
  }
};
