// services/paymentService.js
// Usar la misma URL que el resto de la app. En el navegador no existe `process`,
// por eso usamos `import.meta.env` (Vite) cuando esté disponible.
const API_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:5001";

export const paymentService = {
  // Determinar estado de pago
  determinePaymentStatus(result, paymentMethod, metodosPago = []) {
    if (result.estadoPago) return result.estadoPago;
    if (result.pagoExitoso === true) return "COMPLETADO";
    if (result.pagoExitoso === false) return "FALLIDO";
    if (result.transaccionId || result.paymentId || result.numeroTransaccion)
      return "COMPLETADO";

    const metodoSeleccionado = Array.isArray(metodosPago)
      ? metodosPago.find((m) => m.id?.toString() === paymentMethod)
      : null;

    if (metodoSeleccionado) {
      const tipo = (metodoSeleccionado.tipo || "").toLowerCase();
      const nombre = (metodoSeleccionado.nombre || "").toLowerCase();
      if (["transferencia", "deposito", "efectivo"].includes(tipo))
        return "PENDIENTE_VERIFICACION";
      if (this.isMpMethod(metodoSeleccionado)) return "PENDIENTE";
      if (["tarjeta", "paypal", "yape", "plin"].includes(tipo))
        return "PENDIENTE";
      if (
        nombre.includes("paypal") ||
        nombre.includes("yape") ||
        nombre.includes("plin")
      )
        return "PENDIENTE";
    }
    return "PENDIENTE";
  },

  // Verificar si es método Mercado Pago
  isMpMethod(method) {
    if (!method) return false;
    const name = (method.nombre || "").toLowerCase();
    return (
      name.includes("tarjeta") ||
      name.includes("mercado") ||
      name.includes("mpago") ||
      method.tipo === "mercadopago" ||
      method.id === 2
    );
  },

  // Crear preferencia de Mercado Pago
  async crearPreferenciaMp(orderId, payerEmail, items) {
    try {
      console.log("🧾 Enviando a /preference:", { orderId, payerEmail, items });

      const response = await fetch(`${API_URL}/api/payments/mp/preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, payerEmail, items }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("🔁 Respuesta /preference:", data);

      if (!response.ok) {
        const msg =
          data?.error ||
          data?.debug?.message ||
          `No se pudo crear la preferencia de Mercado Pago (HTTP ${response.status})`;
        throw new Error(msg);
      }

      if (!data?.id) {
        throw new Error(
          "La respuesta de Mercado Pago no contiene un ID de preferencia."
        );
      }

      return data.id;
    } catch (error) {
      console.error("Error creating MP preference:", error);
      throw error;
    }
  },

  // Consultar estado del pedido
  async fetchOrderStatus(orderId) {
    try {
      const response = await fetch(`${API_URL}/api/pedidos/${orderId}`);
      if (!response.ok) throw new Error("No se pudo consultar el pedido");
      return await response.json();
    } catch (error) {
      console.error("Error fetching order status:", error);
      throw error;
    }
  },

  // Iniciar polling del pedido
  startPollingOrder(orderId, onSuccess, onFailure, onTimeout) {
    let pollingId = null;
    let pollCount = 0;
    const maxPolls = 120; // 6 minutos de polling

    const poll = async () => {
      pollCount++;
      try {
        const data = await this.fetchOrderStatus(orderId);
        const raw = (data.estado_pago || data.estadoPago || "")
          .toString()
          .toUpperCase();
        const ok = [
          "APPROVED",
          "ACCREDITED",
          "COMPLETADO",
          "APROBADO",
        ].includes(raw);
        const bad = [
          "REJECTED",
          "RECHAZADO",
          "FALLIDO",
          "CANCELLED",
          "CANCELED",
        ].includes(raw);

        console.log(`🔄 Polling #${pollCount}: estado_pago=${raw}`);

        if (ok) {
          console.log("✅ Pago COMPLETADO detectado!");
          if (pollingId) clearInterval(pollingId);
          onSuccess(data);
        } else if (bad) {
          console.log("❌ Pago RECHAZADO!");
          if (pollingId) clearInterval(pollingId);
          onFailure(
            "Pago rechazado por Mercado Pago. Intenta con otra tarjeta."
          );
        } else if (pollCount >= maxPolls) {
          console.log(
            "⏱️ Timeout: Se alcanzó el máximo de intentos de polling"
          );
          if (pollingId) clearInterval(pollingId);
          onTimeout(
            "El pago toma más tiempo del esperado. Consulta tu estado en MercadoPago."
          );
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (pollCount >= maxPolls) {
          if (pollingId) clearInterval(pollingId);
          onTimeout("Error al verificar el pago. Inténtalo de nuevo.");
        }
      }
    };

    pollingId = setInterval(poll, 2000); // Polling cada 2 segundos
    return pollingId;
  },
};
