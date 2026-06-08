// Validaciones para el formulario de tarjetas de usuario

export const validateTipoTarjeta = (tipo) => {
  if (!tipo || tipo.trim() === '') {
    return 'El tipo de tarjeta es obligatorio';
  }
  
  const tiposPermitidos = ['Visa', 'Mastercard', 'American Express', 'Discover', 'Otro'];
  if (!tiposPermitidos.includes(tipo)) {
    return 'Tipo de tarjeta no válido';
  }
  
  return undefined;
};

// Algoritmo de Luhn para validar número de tarjeta
const luhnCheck = (num) => {
  let arr = (num + '')
    .split('')
    .reverse()
    .map(x => parseInt(x));
  let lastDigit = arr.splice(0, 1)[0];
  let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
  sum += lastDigit;
  return sum % 10 === 0;
};

export const validateNumeroTarjeta = (numero) => {
  if (!numero || numero.trim() === '') {
    return 'El número de tarjeta es obligatorio';
  }
  
  // Quitar espacios
  const numeroLimpio = numero.replace(/\s/g, '');
  
  // Validar que solo contenga números
  if (!/^\d+$/.test(numeroLimpio)) {
    return 'El número de tarjeta solo debe contener dígitos';
  }
  
  // Validar longitud (13-19 dígitos)
  if (numeroLimpio.length < 13 || numeroLimpio.length > 19) {
    return 'El número de tarjeta debe tener entre 13 y 19 dígitos';
  }
  
  // Validar con algoritmo de Luhn
  if (!luhnCheck(numeroLimpio)) {
    return 'El número de tarjeta no es válido';
  }
  
  return undefined;
};

export const validateFechaVencimiento = (fecha) => {
  if (!fecha || fecha.trim() === '') {
    return 'La fecha de vencimiento es obligatoria';
  }
  
  // Validar formato MM/AA
  if (!/^\d{2}\/\d{2}$/.test(fecha)) {
    return 'El formato debe ser MM/AA';
  }
  
  // Extraer mes y año
  const [mes, año] = fecha.split('/').map(num => parseInt(num, 10));
  
  // Validar mes (01-12)
  if (mes < 1 || mes > 12) {
    return 'El mes debe estar entre 01 y 12';
  }
  
  // Validar que la tarjeta no esté vencida
  const ahora = new Date();
  const añoActual = ahora.getFullYear() % 100; // Últimos 2 dígitos
  const mesActual = ahora.getMonth() + 1;
  
  if (año < añoActual || (año === añoActual && mes < mesActual)) {
    return 'La tarjeta está vencida';
  }
  
  // Validar que no sea muy lejana (máximo 20 años en el futuro)
  if (año > añoActual + 20) {
    return 'La fecha de vencimiento no es válida';
  }
  
  return undefined;
};

export const validateNombreEnTarjeta = (nombre) => {
  if (!nombre || nombre.trim() === '') {
    return 'El nombre en la tarjeta es obligatorio';
  }
  
  const nombreTrimmed = nombre.trim();
  
  // Validar longitud (2-50 caracteres)
  if (nombreTrimmed.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (nombreTrimmed.length > 50) {
    return 'El nombre no puede exceder 50 caracteres';
  }
  
  // Validar que solo contenga letras y espacios
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreTrimmed)) {
    return 'El nombre solo puede contener letras y espacios';
  }
  
  return undefined;
};

// Función para validar todo el formulario
export const validateTarjetaForm = (formData) => {
  const errors = {};
  
  // Validar tipo de tarjeta
  const tipoError = validateTipoTarjeta(formData.tipoTarjeta);
  if (tipoError) errors.tipoTarjeta = tipoError;
  
  // Validar número de tarjeta
  const numeroError = validateNumeroTarjeta(formData.numeroTarjeta);
  if (numeroError) errors.numeroTarjeta = numeroError;
  
  // Validar fecha de vencimiento
  const fechaError = validateFechaVencimiento(formData.fechaVencimiento);
  if (fechaError) errors.fechaVencimiento = fechaError;
  
  // Validar nombre en tarjeta
  const nombreError = validateNombreEnTarjeta(formData.nombreEnTarjeta);
  if (nombreError) errors.nombreEnTarjeta = nombreError;
  
  return errors;
};

// Función auxiliar para validar un campo individual
export const validateField = (fieldName, value, formData = {}) => {
  switch (fieldName) {
    case 'tipoTarjeta':
      return validateTipoTarjeta(value);
    case 'numeroTarjeta':
      return validateNumeroTarjeta(value);
    case 'fechaVencimiento':
      return validateFechaVencimiento(value);
    case 'nombreEnTarjeta':
      return validateNombreEnTarjeta(value);
    default:
      return undefined;
  }
};
