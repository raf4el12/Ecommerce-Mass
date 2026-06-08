import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Mail, Home, Info } from "lucide-react";
import { useCarrito } from "../context/carContext";
import "./CheckoutPending.css";

const CheckoutPending = () => {
  const navigate = useNavigate();
  const { vaciarCarrito } = useCarrito();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (vaciarCarrito) {
      vaciarCarrito();
    }

    // Countdown for auto-redirect
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate("/");
    }
  }, [navigate, vaciarCarrito, countdown]);

  const handleGoHome = () => navigate("/");

  return (
    <div className="checkout-status-container pending">
      {/* Background decoration */}
      <div className="bg-decoration"></div>

      <div className="status-card pending">
        {/* Icon */}
        <div className="icon-wrapper">
          <Clock className="status-icon pending" />
        </div>

        {/* Title */}
        <h1 className="status-title">Pago en Verificación</h1>

        {/* Message */}
        <p className="status-message">
          Tu transacción está siendo procesada por Mercado Pago. Este proceso puede tomar algunos minutos.
        </p>

        {/* Info Box */}
        <div className="info-box pending-info">
          <Mail size={20} />
          <div>
            <p><strong>Permanece atento a tu correo</strong></p>
            <p>Recibirás una confirmación cuando el pago sea verificado completamente</p>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="timeline">
          <h3>¿Qué sucede a continuación?</h3>
          <div className="timeline-steps">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <div>
                <strong>Verificación</strong>
                <p>MercadoPago valida tu transacción (segundos a minutos)</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-number">2</div>
              <div>
                <strong>Confirmación</strong>
                <p>Recibirás un correo confirmando el estado del pago</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-number">3</div>
              <div>
                <strong>Tu Pedido</strong>
                <p>Iniciaremos la preparación tan pronto se confirme el pago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="countdown-box pending">
          <p>Volviendo a la tienda en <span className="countdown-number">{countdown}</span>s</p>
        </div>

        {/* Action Button */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleGoHome}>
            <Home size={18} />
            Ir a la Tienda Ahora
          </button>
        </div>

        {/* Help Section */}
        <div className="help-box">
          <Info size={18} />
          <div>
            <p><strong>¿No recibes confirmación?</strong></p>
            <p>Si en 24 horas no recibes la confirmación, contáctanos a <strong>soporte@tiendasmass.com</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPending;
