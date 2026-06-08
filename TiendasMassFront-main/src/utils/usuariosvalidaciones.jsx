// usuariosvalidaciones.jsx - Validaciones del módulo de Gestión de Usuarios

// ✅ 1. Nombre
export const validateNombre = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El nombre es requerido');
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (value.length > 100) {
    errors.push('El nombre no puede superar los 100 caracteres');
  }
  
  // Solo letras (con acentos) y espacios
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(value)) {
    errors.push('El nombre solo puede contener letras y espacios');
  }
  
  return errors;
};

// ✅ 2. Email
export const validateEmail = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El correo electrónico es requerido');
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length > 254) {
    errors.push('El correo es demasiado largo');
    return errors;
  }
  
  // Formato email válido
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedValue)) {
    errors.push('Formato de correo inválido (ejemplo@correo.com)');
  }
  
  return errors;
};

// ✅ 3. Password
export const validatePassword = (value, isRequired = true) => {
  const errors = [];
  
  // Si no es requerido y está vacío, es válido (modo edición)
  if (!isRequired && (!value || value.trim() === '')) {
    return errors;
  }
  
  if (!value || value.trim() === '') {
    errors.push('La contraseña es requerida');
    return errors;
  }
  
  if (value.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (value.length > 128) {
    errors.push('La contraseña no puede superar los 128 caracteres');
  }
  
  // No puede contener espacios
  if (/\s/.test(value)) {
    errors.push('No puede contener espacios en blanco');
    return errors;
  }
  
  // Al menos una mayúscula
  if (!/[A-Z]/.test(value)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  // Al menos una minúscula
  if (!/[a-z]/.test(value)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  // Al menos un número
  if (!/[0-9]/.test(value)) {
    errors.push('Debe contener al menos un número');
  }
  
  return errors;
};

// ✅ 4. Dirección
export const validateDireccion = (value) => {
  const errors = [];
  
  // Campo opcional - vacío es válido
  if (!value || value.trim() === '') {
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres');
  }
  
  if (value.length > 200) {
    errors.push('La dirección es demasiado larga');
  }
  
  // Caracteres permitidos: letras, números, espacios, ,.-#°
  const direccionRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,.\-#°]+$/;
  if (!direccionRegex.test(value)) {
    errors.push('La dirección contiene caracteres no permitidos');
  }
  
  // Debe contener al menos una letra
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) {
    errors.push('La dirección debe contener al menos una letra');
  }
  
  // No puede ser solo números
  if (/^[\d\s,.\-#°]+$/.test(value)) {
    errors.push('La dirección debe incluir texto descriptivo');
  }
  
  return errors;
};

// ✅ 5. Teléfono
export const validateTelefono = (value) => {
  const errors = [];
  
  // Campo opcional - vacío es válido
  if (!value || value.trim() === '') {
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  // Máximo 20 caracteres totales
  if (trimmedValue.length > 20) {
    errors.push('El teléfono es demasiado largo (máx. 20 caracteres)');
  }
  
  // Solo dígitos y símbolos permitidos: +()-.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{0,4}$/;
  if (!phoneRegex.test(trimmedValue)) {
    errors.push('El teléfono solo puede contener números y símbolos: + ( ) - .');
  }
  
  // Contar solo dígitos
  const digitsOnly = trimmedValue.replace(/\D/g, '');
  
  if (digitsOnly.length < 7) {
    errors.push('El teléfono debe tener al menos 7 dígitos');
  }
  
  if (digitsOnly.length > 15) {
    errors.push('El teléfono no puede tener más de 15 dígitos');
  }
  
  return errors;
};

// ✅ 6. Ciudad
export const validateCiudad = (value) => {
  const errors = [];
  
  // Campo opcional - vacío es válido
  if (!value || value.trim() === '') {
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < 2) {
    errors.push('La ciudad debe tener al menos 2 caracteres');
  }
  
  if (value.length > 100) {
    errors.push('La ciudad no puede superar los 100 caracteres');
  }
  
  // Solo letras (con acentos), espacios, -, ', .
  const ciudadRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-'\.]+$/;
  if (!ciudadRegex.test(value)) {
    errors.push('La ciudad solo puede contener letras, espacios, guión y apóstrofo');
  }
  
  // No puede contener números
  if (/\d/.test(value)) {
    errors.push('La ciudad no puede contener números');
  }
  
  // No puede empezar o terminar con guión
  if (trimmedValue.startsWith('-') || trimmedValue.endsWith('-')) {
    errors.push('La ciudad no puede empezar o terminar con guión');
  }
  
  // Debe contener al menos una letra
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) {
    errors.push('La ciudad debe contener letras');
  }
  
  return errors;
};

// ✅ 7. Código Postal
export const validateCodigoPostal = (value) => {
  const errors = [];
  
  // Campo opcional - vacío es válido
  if (!value || value.trim() === '') {
    return errors;
  }
  
  const trimmedValue = value.trim();
  
  // Solo dígitos
  const codigoRegex = /^\d{4,10}$/;
  if (!codigoRegex.test(trimmedValue)) {
    if (/\D/.test(trimmedValue)) {
      errors.push('El código postal solo puede contener números');
    } else if (trimmedValue.length < 4) {
      errors.push('El código postal debe tener al menos 4 dígitos');
    } else if (trimmedValue.length > 10) {
      errors.push('El código postal no puede tener más de 10 dígitos');
    }
    return errors;
  }
  
  // No puede ser solo ceros
  if (/^0+$/.test(trimmedValue)) {
    errors.push('El código postal no puede ser solo ceros');
  }
  
  return errors;
};

// 🔧 Funciones Helper

// Validar todo el formulario de usuario
export const validateUserForm = (formData, isEditing = false) => {
  const allErrors = {};
  
  const nombreErrors = validateNombre(formData.nombre);
  if (nombreErrors.length > 0) allErrors.nombre = nombreErrors;
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) allErrors.email = emailErrors;
  
  // Password: requerido solo en creación
  const passwordErrors = validatePassword(formData.password, !isEditing);
  if (passwordErrors.length > 0) allErrors.password = passwordErrors;
  
  const direccionErrors = validateDireccion(formData.direccion);
  if (direccionErrors.length > 0) allErrors.direccion = direccionErrors;
  
  const telefonoErrors = validateTelefono(formData.telefono);
  if (telefonoErrors.length > 0) allErrors.telefono = telefonoErrors;
  
  const ciudadErrors = validateCiudad(formData.ciudad);
  if (ciudadErrors.length > 0) allErrors.ciudad = ciudadErrors;
  
  const codigoPostalErrors = validateCodigoPostal(formData.codigoPostal);
  if (codigoPostalErrors.length > 0) allErrors.codigoPostal = codigoPostalErrors;
  
  return allErrors;
};

// Buscar usuarios duplicados por email
export const checkDuplicateEmail = (users, email, excludeId = null) => {
  if (!email || !users) return false;
  
  const normalizedEmail = email.trim().toLowerCase();
  
  return users.some(user => {
    if (excludeId && user.id === excludeId) return false;
    return user.email?.trim().toLowerCase() === normalizedEmail;
  });
};

// Normalizar email (trim + toLowerCase)
export const normalizeEmail = (email) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

// Normalizar nombre (trim + capitalizar primera letra de cada palabra)
export const normalizeName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Función helper para validar un campo individual
export const validateField = (fieldName, value, isEditing = false) => {
  switch (fieldName) {
    case 'nombre':
      return validateNombre(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value, !isEditing);
    case 'direccion':
      return validateDireccion(value);
    case 'telefono':
      return validateTelefono(value);
    case 'ciudad':
      return validateCiudad(value);
    case 'codigoPostal':
      return validateCodigoPostal(value);
    default:
      return [];
  }
};

// Obtener nombre de campo legible
export const getFieldDisplayName = (fieldName) => {
  const fieldNames = {
    nombre: 'Nombre',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    direccion: 'Dirección',
    telefono: 'Teléfono',
    ciudad: 'Ciudad',
    codigoPostal: 'Código Postal'
  };
  return fieldNames[fieldName] || fieldName;
};
