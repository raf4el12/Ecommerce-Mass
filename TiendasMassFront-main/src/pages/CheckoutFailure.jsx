import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { XCircle, ChevronLeft, AlertTriangle, Home } from "lucide-react";
import { useCarrito } from "../context/carContext";
import "./CheckoutFailure.css";

const CheckoutFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vaciarCarrito } = useCarrito();
  const [errorReason, setErrorReason] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const reason = query.get("reason") || "Tu pago fue rechazado o cancelado.";
    setErrorReason(reason);
  }, [location.search]);

  const handleRetry = () => navigate("/checkout");
  const handleGoHome = () => navigate("/");

  return (
    <div className="checkout-status-container failure">
      {/* Background decoration */}
      <div className="bg-decoration"></div>

      <div className="status-card error">
        {/* Icon */}
        <div className="icon-wrapper">
          <XCircle className="status-icon error" />
        </div>

        {/* Title */}
        <h1 className="status-title">Pago No Completado</h1>

        {/* Message */}
        <p className="status-message">{errorReason}</p>

        {/* Error Info Box */}
        <div className="info-box error-info">
          <AlertTriangle size={20} />
          <div>
            <p><strong>¿Qué sucedió?</strong></p>
            <p>Tu banco rechazó la transacción o fue cancelada. Esto puede ocurrir por fondos insuficientes, datos incorrectos o limitaciones de la tarjeta.</p>
          </div>
        </div>

        {/* Tips */}
        <div className="tips-box">
          <h3>Recomendaciones para intentar de nuevo:</h3>
          <ul className="tips-list">
            <li><span className="tip-icon">✓</span> Verifica los datos de tu tarjeta</li>
            <li><span className="tip-icon">✓</span> Asegúrate de tener saldo disponible</li>
            <li><span className="tip-icon">✓</span> Intenta con otro método de pago</li>
            <li><span className="tip-icon">✓</span> Contacta a tu banco si el problema persiste</li>
            <li><span className="tip-icon">✓</span> Prueba con otro navegador si es necesario</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleRetry}>
            <ChevronLeft size={18} />
            Reintentar Pago
          </button>
          <button className="btn btn-secondary" onClick={handleGoHome}>
            <Home size={18} />
            Volver a la Tienda
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailure;
