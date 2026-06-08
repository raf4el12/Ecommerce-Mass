// validations.jsx - Validaciones del módulo de Checkout

// 📋 1. Datos Personales

export const validateFullName = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El nombre completo no puede estar vacío');
    return errors;
  }
  
  if (value.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }
  
  return errors;
};

export const validateEmail = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El correo electrónico no puede estar vacío');
    return errors;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    errors.push('Formato de correo electrónico inválido');
  }
  
  return errors;
};

export const validatePhone = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El teléfono no puede estar vacío');
    return errors;
  }
  
  // Limpiar espacios y caracteres no numéricos para contar dígitos
  const digitsOnly = value.replace(/\D/g, '');
  
  // Aceptar móviles (9 dígitos) o fijos (6-7 dígitos)
  if (digitsOnly.length < 6) {
    errors.push('El teléfono debe tener al menos 6 dígitos');
  }
  
  if (digitsOnly.length === 8) {
    errors.push('El teléfono debe tener 6-7 dígitos (fijo) o 9 dígitos (móvil)');
  }
  
  if (digitsOnly.length > 9) {
    errors.push('El teléfono no puede exceder 9 dígitos');
  }
  
  return errors;
};

// 💳 2. Pago con Tarjeta

export const validateCardNumber = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El número de tarjeta no puede estar vacío');
    return errors;
  }
  
  // Limpiar espacios
  const cleanNumber = value.replace(/\s/g, '');
  
  if (cleanNumber.length < 15 || cleanNumber.length > 16) {
    errors.push('El número de tarjeta debe tener 15-16 dígitos');
  }
  
  if (!/^\d+$/.test(cleanNumber)) {
    errors.push('El número de tarjeta solo debe contener dígitos');
  }
  
  return errors;
};

export const validateCardName = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El nombre del titular no puede estar vacío');
    return errors;
  }
  
  if (value.trim().length < 3) {
    errors.push('El nombre del titular debe tener al menos 3 caracteres');
  }
  
  return errors;
};

export const validateCardExpiry = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('La fecha de vencimiento no puede estar vacía');
    return errors;
  }
  
  // Verificar formato MM/AA
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!expiryRegex.test(value)) {
    errors.push('El formato debe ser MM/AA (ej: 12/25)');
    return errors;
  }
  
  // Validar que no esté vencida
  const [month, year] = value.split('/').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Últimos 2 dígitos del año
  const currentMonth = currentDate.getMonth() + 1; // getMonth() retorna 0-11
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    errors.push('La tarjeta está vencida');
  }
  
  return errors;
};

export const validateCardCVV = (value) => {
  const errors = [];
  
  if (!value || value.trim() === '') {
    errors.push('El CVV no puede estar vacío');
    return errors;
  }
  
  if (value.length < 3 || value.length > 4) {
    errors.push('El CVV debe tener 3 o 4 dígitos');
  }
  
  if (!/^\d+$/.test(value)) {
    errors.push('El CVV solo debe contener dígitos');
  }
  
  return errors;
};

// 🚚 3. Dirección de Envío (condicional: solo si deliveryType === 'delivery')

export const validateAddress = (value, deliveryType) => {
  const errors = [];
  
  // Solo validar si es delivery
  if (deliveryType !== 'delivery') {
    return errors;
  }
  
  if (!value || value.trim() === '') {
    errors.push('La dirección no puede estar vacía');
    return errors;
  }
  
  if (value.trim().length < 10) {
    errors.push('La dirección debe tener al menos 10 caracteres');
  }
  
  return errors;
};

export const validateReference = (value) => {
  const errors = [];
  
  // Campo opcional
  if (!value || value.trim() === '') {
    return errors;
  }
  
  // Si se llena, validar longitud mínima
  if (value.trim().length < 5) {
    errors.push('La referencia debe tener al menos 5 caracteres');
  }
  
  return errors;
};

export const validateCity = (value, deliveryType) => {
  const errors = [];
  
  // Solo validar si es delivery
  if (deliveryType !== 'delivery') {
    return errors;
  }
  
  if (!value || value.trim() === '') {
    errors.push('La ciudad no puede estar vacía');
    return errors;
  }
  
  if (value.trim().length < 3) {
    errors.push('La ciudad debe tener al menos 3 caracteres');
  }
  
  return errors;
};

export const validateZipCode = (value, deliveryType) => {
  const errors = [];
  
  // Solo validar si es delivery
  if (deliveryType !== 'delivery') {
    return errors;
  }
  
  if (!value || value.trim() === '') {
    errors.push('El código postal no puede estar vacío');
    return errors;
  }
  
  if (value.trim().length < 4) {
    errors.push('El código postal debe tener al menos 4 caracteres');
  }
  
  return errors;
};

export const validateCountry = (value, deliveryType) => {
  const errors = [];
  
  // Solo validar si es delivery
  if (deliveryType !== 'delivery') {
    return errors;
  }
  
  if (!value || value.trim() === '') {
    errors.push('El país no puede estar vacío');
  }
  
  return errors;
};

// 🏪 4. Recojo en Tienda (condicional: solo si deliveryType === 'pickup')

export const validateSelectedStore = (value, deliveryType) => {
  const errors = [];
  
  // Solo validar si es pickup
  if (deliveryType !== 'pickup') {
    return errors;
  }
  
  if (!value || value.trim() === '') {
    errors.push('Debe seleccionar una tienda');
  }
  
  return errors;
};

// 🔧 Función Helper: validateField
export const validateField = (fieldName, value, deliveryType = 'delivery') => {
  switch (fieldName) {
    case 'fullName':
      return validateFullName(value);
    case 'email':
      return validateEmail(value);
    case 'phone':
      return validatePhone(value);
    case 'cardNumber':
      return validateCardNumber(value);
    case 'cardName':
      return validateCardName(value);
    case 'cardExpiry':
      return validateCardExpiry(value);
    case 'cardCVV':
      return validateCardCVV(value);
    case 'address':
      return validateAddress(value, deliveryType);
    case 'reference':
      return validateReference(value);
    case 'city':
      return validateCity(value, deliveryType);
    case 'zipCode':
      return validateZipCode(value, deliveryType);
    case 'country':
      return validateCountry(value, deliveryType);
    case 'selectedStore':
      return validateSelectedStore(value, deliveryType);
    default:
      return [];
  }
};

// Función para validar todo el formulario de checkout
export const validateCheckoutForm = (formData, deliveryType = 'delivery', requiresCardInfo = false) => {
  const allErrors = {};
  
  // 1. Datos Personales (siempre requeridos)
  const fullNameErrors = validateFullName(formData.fullName);
  if (fullNameErrors.length > 0) allErrors.fullName = fullNameErrors;
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) allErrors.email = emailErrors;
  
  const phoneErrors = validatePhone(formData.phone);
  if (phoneErrors.length > 0) allErrors.phone = phoneErrors;
  
  // 2. Pago con Tarjeta (solo si se requiere)
  if (requiresCardInfo) {
    const cardNumberErrors = validateCardNumber(formData.cardNumber);
    if (cardNumberErrors.length > 0) allErrors.cardNumber = cardNumberErrors;
    
    const cardNameErrors = validateCardName(formData.cardName);
    if (cardNameErrors.length > 0) allErrors.cardName = cardNameErrors;
    
    const cardExpiryErrors = validateCardExpiry(formData.cardExpiry);
    if (cardExpiryErrors.length > 0) allErrors.cardExpiry = cardExpiryErrors;
    
    const cardCVVErrors = validateCardCVV(formData.cardCVV);
    if (cardCVVErrors.length > 0) allErrors.cardCVV = cardCVVErrors;
  }
  
  // 3. Dirección de Envío (solo si deliveryType === 'delivery')
  if (deliveryType === 'delivery') {
    const addressErrors = validateAddress(formData.address, deliveryType);
    if (addressErrors.length > 0) allErrors.address = addressErrors;
    
    const referenceErrors = validateReference(formData.reference);
    if (referenceErrors.length > 0) allErrors.reference = referenceErrors;
    
    const cityErrors = validateCity(formData.city, deliveryType);
    if (cityErrors.length > 0) allErrors.city = cityErrors;
    
    const zipCodeErrors = validateZipCode(formData.zipCode, deliveryType);
    if (zipCodeErrors.length > 0) allErrors.zipCode = zipCodeErrors;
    
    const countryErrors = validateCountry(formData.country, deliveryType);
    if (countryErrors.length > 0) allErrors.country = countryErrors;
  }
  
  // 4. Recojo en Tienda (solo si deliveryType === 'pickup')
  if (deliveryType === 'pickup') {
    const selectedStoreErrors = validateSelectedStore(formData.selectedStore, deliveryType);
    if (selectedStoreErrors.length > 0) allErrors.selectedStore = selectedStoreErrors;
  }
  
  return allErrors;
};
