export const validators = {
  // Información Personal
  fullName: (value) => {
    if (!value || value.trim().length === 0) return 'El nombre completo es requerido';
    if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
    return '';
  },

  email: (value) => {
    if (!value || value.trim().length === 0) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'El email no es válido';
    return '';
  },

  phone: (value) => {
    if (!value || value.trim().length === 0) return 'El teléfono es requerido';
    if (value.trim().length < 9) return 'El teléfono debe tener al menos 9 dígitos';
    return '';
  },

  // Información de Tarjeta
  cardNumber: (value) => {
    if (!value || value.trim().length === 0) return 'El número de tarjeta es requerido';
    const cleanNumber = value.replace(/\s/g, '');
    if (cleanNumber.length < 15 || cleanNumber.length > 16) {
      return 'El número de tarjeta debe tener entre 15 y 16 dígitos';
    }
    return '';
  },

  cardName: (value) => {
    if (!value || value.trim().length === 0) return 'El nombre del titular es requerido';
    if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
    return '';
  },

  cardExpiry: (value) => {
    if (!value || value.trim().length === 0) return 'La fecha de vencimiento es requerida';
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(value)) return 'Formato inválido (MM/AA)';
    
    const [month, year] = value.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return 'La tarjeta está vencida';
    }
    return '';
  },

  cardCVV: (value) => {
    if (!value || value.trim().length === 0) return 'El CVV es requerido';
    if (value.trim().length < 3 || value.trim().length > 4) {
      return 'El CVV debe tener 3 o 4 dígitos';
    }
    return '';
  },

  // Información de Envío (condicional - solo para delivery)
  address: (value, deliveryType) => {
    if (deliveryType !== 'delivery') return '';
    if (!value || value.trim().length === 0) return 'La dirección es requerida';
    if (value.trim().length < 10) return 'La dirección debe tener al menos 10 caracteres';
    return '';
  },

  reference: (value) => {
    if (value && value.trim().length > 0 && value.trim().length < 5) {
      return 'La referencia debe tener al menos 5 caracteres';
    }
    return '';
  },

  city: (value, deliveryType) => {
    if (deliveryType !== 'delivery') return '';
    if (!value || value.trim().length === 0) return 'La ciudad es requerida';
    if (value.trim().length < 3) return 'La ciudad debe tener al menos 3 caracteres';
    return '';
  },

  zipCode: (value, deliveryType) => {
    if (deliveryType !== 'delivery') return '';
    if (!value || value.trim().length === 0) return 'El código postal es requerido';
    if (value.trim().length < 4) return 'El código postal debe tener al menos 4 caracteres';
    return '';
  },

  country: (value, deliveryType) => {
    if (deliveryType !== 'delivery') return '';
    if (!value || value.trim().length === 0) return 'El país es requerido';
    return '';
  },

  // Recogida en tienda (condicional - solo para pickup)
  selectedStore: (value, deliveryType) => {
    if (deliveryType !== 'pickup') return '';
    if (!value || value.trim().length === 0) return 'Debes seleccionar una tienda';
    return '';
  }
};

export const validateField = (fieldName, value, extraContext = {}) => {
  const validator = validators[fieldName];
  if (!validator) {
    console.warn(`No validator found for field: ${fieldName}`);
    return '';
  }
  
  if (['address', 'city', 'zipCode', 'country', 'selectedStore'].includes(fieldName)) {
    return validator(value, extraContext.deliveryType);
  }
  
  return validator(value);
};