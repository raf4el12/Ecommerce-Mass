import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, ShoppingBag, Mail } from "lucide-react";
import { useCarrito } from "../context/carContext";
import "./CheckoutSuccess.css";

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vaciarCarrito } = useCarrito();
  const [status, setStatus] = useState("Verificando tu pago...");
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const paymentId = query.get("payment_id");

    if (!paymentId) {
      setStatus("No encontramos el ID de pago en la URL.");
      setPaymentStatus("error");
      return;
    }

    const confirmarPago = async () => {
      try {
        const resp = await fetch(`http://localhost:5001/api/payments/mp/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferenceId: paymentId }),
        });

        const data = await resp.json();

        if (resp.ok) {
          if (data.statusMp === "approved") {
            setStatus("¡Tu pedido está confirmado y en camino!");
            setPaymentStatus("success");
            if (vaciarCarrito) vaciarCarrito();
          } else if (data.statusMp === "pending") {
            setStatus("Estamos verificando tu pago. Te avisamos pronto.");
            setPaymentStatus("pending");
          } else {
            setStatus(`Estado del pago: ${data.statusMp}`);
            setPaymentStatus("pending");
          }
          setOrderId(data.orderId);
        } else {
          setStatus("No pudimos confirmar el pago. Intenta más tarde.");
          setPaymentStatus("error");
        }
      } catch (err) {
        console.error(err);
        setStatus("Error de conexión al confirmar el pago.");
        setPaymentStatus("error");
      }
    };

    confirmarPago();
  }, [location.search]);

  // Auto-redirect después de 5 segundos si el pago fue aprobado
  useEffect(() => {
    if (paymentStatus === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && paymentStatus === "success") {
      navigate("/");
    }
  }, [countdown, paymentStatus, navigate]);

  const handleGoHome = () => navigate("/");

  const renderIcon = () => {
    if (paymentStatus === "success") {
      return (
        <div className="icon-circle success">
          <CheckCircle className="status-icon success" />
        </div>
      );
    } else if (paymentStatus === "pending") {
      return (
        <div className="icon-circle pending">
          <Clock className="status-icon pending" />
        </div>
      );
    } else {
      return (
        <div className="icon-circle error">
          <AlertCircle className="status-icon error" />
        </div>
      );
    }
  };

  const badgeLabel = {
    success: "Pago aprobado",
    pending: "Pago pendiente",
    error: "Error en el pago",
    loading: "Verificando...",
  };

  const titleText = {
    success: "¡Lleva Mass, pagaste Menos!",
    pending: "Pago en verificación",
    error: "Algo salió mal",
    loading: "Confirmando tu compra...",
  };

  return (
    <div className="checkout-status-container">

      {/* Logo Mass */}
      <div className="mass-header">
        <span className="mass-logo-badge">Mass</span>
        <span className="mass-tagline">Lleva Mass · Paga Menos</span>
      </div>

      {/* Tarjeta principal */}
      <div className="status-card">

        {/* Ícono */}
        <div className="icon-wrapper">
          {renderIcon()}
        </div>

        {/* Badge de estado */}
        {paymentStatus !== "loading" && (
          <div className={`status-badge ${paymentStatus}`}>
            {badgeLabel[paymentStatus]}
          </div>
        )}

        {/* Título */}
        <h1 className="status-title">{titleText[paymentStatus]}</h1>

        {/* Mensaje */}
        <p className="status-message">{status}</p>

        {/* ID de pedido */}
        {orderId && (
          <div className="order-number">
            <p className="order-label">Número de pedido</p>
            <p className="order-id">#{orderId}</p>
          </div>
        )}

        {/* Info según estado */}
        {paymentStatus === "success" && (
          <div className="info-box success-info">
            <Mail size={20} />
            <div>
              <strong>¡Gracias por tu compra, caser@!</strong>
              Recibirás un correo con los detalles de tu pedido. Recuerda que estamos siempre cerca de tu hogar.
            </div>
          </div>
        )}

        {paymentStatus === "pending" && (
          <div className="info-box pending-info">
            <Clock size={20} />
            <div>
              <strong>Estamos en ello</strong>
              Tu pago está siendo procesado. Te enviaremos un correo en cuanto se confirme.
            </div>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="info-box error-info">
            <AlertCircle size={20} />
            <div>
              <strong>No te preocupes</strong>
              No se realizó ningún cobro. Si el problema persiste, contáctanos o intenta nuevamente.
            </div>
          </div>
        )}

        {/* Countdown de redireccion */}
        {paymentStatus === "success" && countdown > 0 && (
          <div className="countdown-box">
            Te llevamos a la tienda en{" "}
            <span className="countdown-number">{countdown}</span>{" "}
            {countdown === 1 ? "segundo" : "segundos"}...
          </div>
        )}

        {/* Botón principal */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleGoHome}>
            <ShoppingBag size={18} />
            {paymentStatus === "success" ? "Seguir comprando" : "Volver a la tienda"}
          </button>
        </div>

        {/* Footer */}
        <div className="status-footer">
          <p>
            ¿Tienes dudas? Escríbenos a{" "}
            <strong>servicioalcliente@tiendasmass.pe</strong>
            <br />
            Atención de lunes a domingo · 7 AM a 10 PM
          </p>
        </div>
      </div>

      {/* Pie de página */}
      <p className="mass-footer">© 2026 Tiendas Mass · Compañía Hard Discount S.A.C.</p>

    </div>
  );
};

export default CheckoutSuccess;