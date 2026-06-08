// components/CheckoutHeader.jsx
import React from 'react';
import { Truck, CreditCard, Check, ShieldCheck } from 'lucide-react';

const CheckoutHeader = ({ activeStep, setActiveStep }) => {
  const steps = [
    { id: 1, icon: <Truck size={18} />, label: 'Envío', description: 'Información de envío y entrega' },
    { id: 2, icon: <CreditCard size={18} />, label: 'Pago', description: 'Método de pago y confirmación' },
    { id: 3, icon: <Check size={18} />, label: 'Confirmación', description: 'Pedido completado exitosamente' }
  ];

  const handleStepClick = (stepId) => {
    // Solo permitir navegación hacia atrás, no hacia adelante
    if (stepId < activeStep) {
      setActiveStep(stepId);
    }
  };

  return (
    <header className="checkout-header">
      <div className="header-top">
        <h1>Proceso de Compra</h1>
        <div className="secure-header" role="status" aria-live="polite">
          <ShieldCheck aria-hidden="true" size={16} />
          Compra 100% segura
        </div>
      </div>

      <nav aria-label="Pasos del proceso de compra">
        <ol className="steps" role="tablist">
          {steps.map(s => {
            const isCompleted = activeStep > s.id;
            const isActive = activeStep === s.id;
            const isClickable = s.id < activeStep;

            return (
              <li
                key={s.id}
                className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`step-${s.id}-panel`}
                aria-current={isActive ? 'step' : undefined}
              >
                <button
                  className="step-content"
                  onClick={() => isClickable && handleStepClick(s.id)}
                  disabled={!isClickable}
                  aria-label={`${isCompleted ? 'Completado: ' : ''}${s.label}. ${s.description}`}
                  aria-describedby={`step-${s.id}-description`}
                >
                  <span className="step-icon" aria-hidden="true">{s.icon}</span>
                  <span className="step-label">{s.label}</span>
                </button>
                <div id={`step-${s.id}-description`} className="sr-only">
                  {s.description}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
};

export default CheckoutHeader;