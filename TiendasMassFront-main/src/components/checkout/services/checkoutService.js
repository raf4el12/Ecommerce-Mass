// services/checkoutService.js
const API_URL = "http://localhost:5001";

export const checkoutService = {
  // Obtener métodos de pago
  async fetchMetodosPago() {
    try {
      const response = await fetch(`${API_URL}/api/metodos-pago`);
      if (!response.ok) throw new Error('Error al cargar métodos de pago');
      return await response.json();
    } catch (error) {
      console.error('Error fetching metodos-pago:', error);
      throw error;
    }
  },

  // Obtener métodos de envío
  async fetchMetodosEnvio() {
    try {
      const response = await fetch(`${API_URL}/api/metodos-envio`);
      if (!response.ok) throw new Error('Error al cargar métodos de envío');
      return await response.json();
    } catch (error) {
      console.error('Error fetching metodos-envio:', error);
      throw error;
    }
  },

  // Obtener direcciones del usuario
  // acepta (userToken, userId). Si se pasa userId usa /api/direcciones/usuario/:usuarioId
  async fetchUserAddresses(userToken, userId = null) {
    try {
      const url = userId ? `${API_URL}/api/direcciones/usuario/${userId}` : `${API_URL}/api/direcciones`;
      const opts = userToken ? { headers: { 'Authorization': `Bearer ${userToken}` } } : {};
      const response = await fetch(url, opts);
      if (!response.ok) throw new Error('Error al cargar direcciones');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      throw error;
    }
  },

  // Obtener tarjetas del usuario
  async fetchUserCards(userToken) {
    try {
      const response = await fetch(`${API_URL}/api/tarjetas-usuario`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar tarjetas');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user cards:', error);
      throw error;
    }
  },

  // Crear pedido
  async crearPedido(pedidoData, userToken = null) {
    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && { 'Authorization': `Bearer ${userToken}` })
        },
        body: JSON.stringify(pedidoData)
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error creating pedido:', error);
      throw error;
    }
  }
};