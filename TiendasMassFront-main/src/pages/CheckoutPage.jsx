import React, { useState, useCallback } from 'react';
import Checkout from '../components/checkout/checkout';

const CheckoutPage = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    deliveryType: 'delivery',
    fullName: '',
    email: '',
    phone: '',
    selectedStore: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });

  // ✅ useCallback para evitar loops infinitos
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <Checkout
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        formData={formData}
        setFormData={setFormData}
        onChange={handleChange}
      />
    </main>
  );
};

export default CheckoutPage;
