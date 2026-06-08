// Validadores para el formulario de registro

export const validators = {
  // Validación de Nombre
  name: (value) => {
    const errors = [];
    
    if (!value || value.trim() === '') {
      errors.push('El nombre no puede estar vacío');
      return errors;
    }
    
    if (value.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }
    
    if (value.length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(value)) {
      errors.push('El nombre solo puede contener letras y espacios');
    }
    
    return errors;
  },

  // Validación de Email
  email: (value) => {
    const errors = [];
    
    if (!value || value.trim() === '') {
      errors.push('El correo electrónico no puede estar vacío');
      return errors;
    }
    
    if (value.length > 254) {
      errors.push('El correo electrónico no puede exceder 254 caracteres');
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      errors.push('Formato de correo electrónico inválido');
    }
    
    return errors;
  },

  // Validación de Contraseña
  password: (value) => {
    const errors = [];
    
    if (!value || value === '') {
      errors.push('La contraseña no puede estar vacía');
      return errors;
    }
    
    if (value.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (value.length > 128) {
      errors.push('La contraseña no puede exceder 128 caracteres');
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(value)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/[0-9]/.test(value)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (/\s/.test(value)) {
      errors.push('La contraseña no puede contener espacios');
    }
    
    return errors;
  },

  // Validación de Confirmar Contraseña
  confirmPassword: (value, originalPassword) => {
    const errors = [];
    
    if (!value || value === '') {
      errors.push('Debe confirmar la contraseña');
      return errors;
    }
    
    if (value !== originalPassword) {
      errors.push('Las contraseñas no coinciden');
    }
    
    return errors;
  },

  // Validación de Dirección (OPCIONAL)
  address: (value) => {
    const errors = [];
    
    // Es opcional, si está vacío es válido
    if (!value || value.trim() === '') {
      return errors;
    }
    
    // Si se llena, debe cumplir con mínimo y máximo
    if (value.trim().length < 5) {
      errors.push('La dirección debe tener al menos 5 caracteres');
    }
    
    if (value.length > 200) {
      errors.push('La dirección no puede exceder 200 caracteres');
    }
    
    return errors;
  },

  // Validación de Email para Login (simplificada)
  loginEmail: (value) => {
    const errors = [];
    
    if (!value || value.trim() === '') {
      errors.push('El correo electrónico es requerido');
      return errors;
    }
    
    if (value.length > 254) {
      errors.push('El correo electrónico no puede exceder 254 caracteres');
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      errors.push('Formato de correo electrónico inválido');
    }
    
    return errors;
  },

  // Validación de Contraseña para Login (solo longitud, no complejidad)
  loginPassword: (value) => {
    const errors = [];
    
    if (!value || value === '') {
      errors.push('La contraseña es requerida');
      return errors;
    }
    
    // Detectar si es solo espacios
    if (value.trim() === '') {
      errors.push('La contraseña no puede ser solo espacios');
      return errors;
    }
    
    if (value.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (value.length > 128) {
      errors.push('La contraseña no puede exceder 128 caracteres');
    }
    
    return errors;
  }
};

// Función auxiliar para validar todos los campos del formulario de registro
export const validateRegisterForm = (formData) => {
  const allErrors = {};

  // Mantener compatibilidad: validar `name` solo si viene informado.
  if (formData.name && formData.name.trim() !== '') {
    const nameErrors = validators.name(formData.name);
    if (nameErrors.length > 0) {
      allErrors.name = nameErrors;
    }
  }
  
  const emailErrors = validators.email(formData.email);
  if (emailErrors.length > 0) {
    allErrors.email = emailErrors;
  }
  
  const passwordErrors = validators.password(formData.password);
  if (passwordErrors.length > 0) {
    allErrors.password = passwordErrors;
  }
  
  const confirmPasswordErrors = validators.confirmPassword(formData.confirmPassword, formData.password);
  if (confirmPasswordErrors.length > 0) {
    allErrors.confirmPassword = confirmPasswordErrors;
  }
  
  const addressErrors = validators.address(formData.address);
  if (addressErrors.length > 0) {
    allErrors.address = addressErrors;
  }
  
  return allErrors;
};

// Función auxiliar para validar todos los campos del formulario de login
export const validateLoginForm = (formData) => {
  const allErrors = {};
  
  const emailErrors = validators.loginEmail(formData.email);
  if (emailErrors.length > 0) {
    allErrors.email = emailErrors;
  }
  
  const passwordErrors = validators.loginPassword(formData.password);
  if (passwordErrors.length > 0) {
    allErrors.password = passwordErrors;
  }
  
  return allErrors;
};
