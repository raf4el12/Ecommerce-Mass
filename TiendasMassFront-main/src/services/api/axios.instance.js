import axios from 'axios';

// Instancia centralizada de Axios para realizar llamadas al backend
export const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Puede moverse a .env usando import.meta.env.VITE_API_URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token de autenticación (cuando se implemente login de usuario/admin)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo global de errores (ej. token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Acceso denegado o token expirado');
      // Opcional: Redirigir a login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
