// index.jsx - Punto de entrada del módulo checkout
export { default as Checkout } from './checkout';
export { default as CheckoutHeader } from './components/CheckoutHeader';
export { default as OrderSummary } from './components/OrderSummary';
export { default as LoadingSpinner } from './components/LoadingSpinner';
export { default as Step1Shipping } from './steps/Step1Shipping';
export { default as Step2Payment } from './steps/Step2Payment';
export { default as Step3Confirmation } from './steps/Step3Confirmation';

// Hooks
export { useCheckoutData } from './hooks/useCheckoutData';
export { useCheckoutValidation } from './hooks/useCheckoutValidation';
export { useCheckoutForm } from './hooks/useCheckoutForm';

// Services
export { checkoutService } from './services/checkoutService';
export { paymentService } from './services/paymentService';

// Utils
export { validators, validateField } from './utils/validations';
export { PAYMENT_STATUS, determinePaymentStatus, isPaymentSuccessful, isPaymentFailed } from './utils/paymentStatus';
export { formatCurrency, formatPrice, formatCardNumber, formatExpiryDate } from './utils/formatters';