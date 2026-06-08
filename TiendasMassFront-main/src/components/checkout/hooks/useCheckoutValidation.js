// hooks/useCheckoutValidation.js
import { useState } from 'react';
import { validateField } from '../utils/validations';

export const useCheckoutValidation = (formData) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const deliveryType = formData.deliveryType || 'delivery';

    // Validar campos requeridos
    const requiredFields = ['fullName', 'email', 'phone'];

    if (deliveryType === 'delivery') {
      requiredFields.push('address', 'city', 'zipCode');
    } else if (deliveryType === 'pickup') {
      requiredFields.push('selectedStore');
    }

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field] || '', { deliveryType });
      if (error) {
        newErrors[field] = [error];
      }
    });

    // Validar campos opcionales con lógica especial
    if (formData.reference) {
      const refError = validateField('reference', formData.reference);
      if (refError) newErrors.reference = [refError];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSingleField = (field, value) => {
    const deliveryType = formData.deliveryType || 'delivery';
    const error = validateField(field, value, { deliveryType });

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = [error];
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });

    return !error;
  };

  const clearFieldError = (field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const hasErrors = () => {
    return Object.keys(errors).length > 0;
  };

  const getFieldError = (field) => {
    return errors[field] || [];
  };

  return {
    errors,
    validateForm,
    validateSingleField,
    clearFieldError,
    hasErrors,
    getFieldError
  };
};