// src/components/checkout/checkout.jsx - Componente principal refactorizado
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import CheckoutHeader from './components/CheckoutHeader';
import OrderSummary from './components/OrderSummary';
import Step1Shipping from './steps/Step1Shipping';
import Step2Payment from './steps/Step2Payment';
import Step3Confirmation from './steps/Step3Confirmation';
import { useCheckoutData } from './hooks/useCheckoutData';
import { useCheckoutValidation } from './hooks/useCheckoutValidation';
import { useCheckoutForm } from './hooks/useCheckoutForm';
import { formatCurrency } from './utils/formatters';
import './checkout.css';

// 🆕 Importar componentes de accesibilidad
import Notification from '../Notification';
import { useScreenReader } from '../../hooks/useScreenReader';

export default function Checkout({ activeStep, setActiveStep, formData, setFormData, onChange }) {
  const [pollingId, setPollingId] = useState(null);

  // 🆕 Estados para notificaciones accesibles
  const [notification, setNotification] = useState(null);
  const { announceError, announceSuccess } = useScreenReader();

  // Hooks personalizados
  const checkoutData = useCheckoutData();
  const checkoutForm = useCheckoutForm();
  const validation = useCheckoutValidation(checkoutForm.formData);

  // 🆕 Funciones para notificaciones accesibles
  const showNotification = (type, message, autoClose = true) => {
    setNotification({ type, message, autoClose });
    if (type === 'error') {
      announceError(message);
    } else if (type === 'success') {
      announceSuccess(message);
    }
  };

  const hideNotification = () => setNotification(null);

  // 🆕 Observar cambios en shouldAdvanceStep para ir a Step 3 con métodos no-MP
  React.useEffect(() => {
    if (checkoutForm.shouldAdvanceStep && activeStep === 2) {
      setActiveStep(3);
      checkoutForm.setShouldAdvanceStep(false);
    }
  }, [checkoutForm.shouldAdvanceStep, activeStep, setActiveStep, checkoutForm]);

  // Calcular totales
  const totals = checkoutForm.calculateTotals(checkoutData.metodosEnvio, checkoutData.metodosPago);

  // Validaciones de pasos
  const isStep1Valid = () => {
    if (checkoutForm.formData.carrito?.length === 0) return false;
    if (!checkoutForm.formData.fullName || !checkoutForm.formData.email || !checkoutForm.formData.phone) return false;
    if (checkoutForm.formData.deliveryType === 'delivery') {
      return checkoutForm.formData.address && checkoutForm.formData.city && checkoutForm.formData.zipCode;
    }
    if (checkoutForm.formData.deliveryType === 'pickup') {
      return !!checkoutForm.formData.selectedStore;
    }
    return true;
  };

  const isStep2Valid = () => {
    if (!checkoutForm.paymentMethod) return false;
    if (checkoutForm.paymentMethod === 'userCard' && checkoutForm.selectedCardId) return true;
    const selectedMethod = checkoutData.metodosPago.find(m => m.id?.toString() === checkoutForm.paymentMethod);
    if (!selectedMethod) return false;
    // Para métodos no-tarjeta, asumimos válido por ahora
    return true;
  };

  // Handlers
  const handleNext = async () => {
    if (activeStep === 1) {
      const step1Errors = {};
      ['fullName', 'email', 'phone', 'address', 'city', 'zipCode', 'selectedStore'].forEach(field => {
        const errors = validation.getFieldError(field);
        if (errors.length > 0) {
          step1Errors[field] = errors;
        }
      });

      if (Object.keys(step1Errors).length > 0) {
        const errorMessages = Object.entries(step1Errors).map(([field, errors]) => {
          const fieldNames = {
            fullName: 'Nombre Completo',
            email: 'Correo Electrónico',
            phone: 'Teléfono',
            address: 'Dirección',
            city: 'Ciudad',
            zipCode: 'Código Postal',
            selectedStore: 'Tienda'
          };
          const fieldName = fieldNames[field] || field;
          return errors.map(error => `• <strong>${fieldName}:</strong> ${error}`).join('<br>');
        }).join('<br>');

        Swal.fire({
          icon: 'error',
          title: 'Por favor corrige los siguientes errores:',
          html: errorMessages,
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }

    if (activeStep === 2) {
      await checkoutForm.crearPedido(
        checkoutData.metodosEnvio,
        checkoutData.metodosPago,
        checkoutData.userAddresses,
        checkoutData.userCards
      );
      return;
    }

    setActiveStep(Math.min(activeStep + 1, 3));
  };

  const handlePrev = () => {
    setActiveStep(Math.max(activeStep - 1, 1));
  };

  const handlePlaceOrder = () => {
    handleNext();
  };

  return (
    <div className="checkout-container">
      <CheckoutHeader activeStep={activeStep} setActiveStep={setActiveStep} />

      {/* 🆕 Notificación accesible */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
          autoClose={notification.autoClose}
        />
      )}

      {checkoutForm.error && (
        <div className="error-message" style={{
          background: '#fee',
          color: '#c33',
          padding: 10,
          margin: '10px 0',
          borderRadius: 4,
          border: '1px solid #fcc'
        }}>
          {checkoutForm.error}
        </div>
      )}

      <div className="checkout-main">
        <section className="left">
          {activeStep === 1 && (
            <Step1Shipping
              formData={checkoutForm.formData}
              updateFormData={checkoutForm.updateFormData}
              validation={validation}
              metodosEnvio={checkoutData.metodosEnvio}
              selectedMetodoEnvioId={checkoutForm.selectedMetodoEnvioId}
              setSelectedMetodoEnvioId={checkoutForm.setSelectedMetodoEnvioId}
              userAddresses={checkoutData.userAddresses}
              reloadUserAddresses={checkoutData.reloadUserAddresses}
              selectedAddressId={checkoutForm.selectedAddressId}
              handleAddressChange={checkoutForm.handleAddressChange}
              useCustomAddress={checkoutForm.useCustomAddress}
            />
          )}

          {activeStep === 2 && (
            <Step2Payment
              metodosPago={checkoutData.metodosPago}
              userCards={checkoutData.userCards}
              paymentMethod={checkoutForm.paymentMethod}
              selectedCardId={checkoutForm.selectedCardId}
              handlePaymentMethodChange={checkoutForm.handlePaymentMethodChange}
              cardInfo={checkoutForm.cardInfo}
              updateCardInfo={checkoutForm.updateCardInfo}
              showMpWallet={checkoutForm.showMpWallet}
              mpPrefId={checkoutForm.mpPrefId}
            />
          )}

          {activeStep === 3 && (
            <Step3Confirmation pedidoCreado={checkoutForm.pedidoCreado} />
          )}

          <div className="actions">
            {activeStep > 1 && activeStep < 3 && (
              <button className="btn-secondary" onClick={handlePrev} disabled={checkoutForm.loading}>
                Atrás
              </button>
            )}
            {activeStep < 3 && (
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={
                  checkoutForm.loading ||
                  checkoutForm.showMpWallet ||
                  (activeStep === 1 && !isStep1Valid()) ||
                  (activeStep === 2 && !isStep2Valid())
                }
              >
                {checkoutForm.loading ? 'Procesando...' :
                 checkoutForm.showMpWallet ? 'Procesa en Mercado Pago' :
                 (activeStep === 2 ? 'Realizar Pedido' : 'Continuar')}
              </button>
            )}
          </div>
        </section>

        <aside className="right">
          <OrderSummary
            carrito={checkoutForm.formData.carrito || []}
            totals={totals}
            activeStep={activeStep}
            pedidoCreado={checkoutForm.pedidoCreado}
            onPlaceOrder={handlePlaceOrder}
            loading={checkoutForm.loading}
            showMpWallet={checkoutForm.showMpWallet}
            disabled={
              checkoutForm.loading ||
              checkoutForm.showMpWallet ||
              (activeStep === 1 && !isStep1Valid()) ||
              (activeStep === 2 && !isStep2Valid())
            }
          />
        </aside>
      </div>
    </div>
  );
}
