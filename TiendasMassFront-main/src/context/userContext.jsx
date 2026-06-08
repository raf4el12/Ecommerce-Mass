import React, { createContext, useContext, useState } from 'react';


const API_URL = "http://localhost:5001";
const UsuarioContext = createContext();

export const UsuarioProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const storedUser =
        localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
      const storedToken =
        localStorage.getItem('token') || sessionStorage.getItem('token');

      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error al inicializar usuario:', error);
    }
    return null;
  });

  const login = (loginData, remember = true) => {
    try {
      let usuario, token;

      // Estructura esperada: { usuario, token }
      if (loginData.usuario && loginData.token) {
        usuario = loginData.usuario;
        token = loginData.token;
      } else if (loginData.token) {
        const { token: authToken, ...userData } = loginData;
        usuario = userData;
        token = authToken;
      } else {
        throw new Error('Datos de login inválidos');
      }

      setUsuario(usuario);

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('usuario', JSON.stringify(usuario));
      storage.setItem('token', token);

      // Limpia el otro almacenamiento
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem('usuario');
      otherStorage.removeItem('token');

    } catch (error) {
      console.error('Error al hacer login:', error);
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
  };

  const getToken = () => {
    return (
      localStorage.getItem('token') || sessionStorage.getItem('token') || null
    );
  };

  const isAuthenticated = Boolean(usuario && getToken());

  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const reloadUserFromStorage = () => {
    try {
      const storedUser =
        localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
      const storedToken =
        localStorage.getItem('token') || sessionStorage.getItem('token');

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUsuario(parsedUser);
        return parsedUser;
      } else {
        setUsuario(null);
        return null;
      }
    } catch (error) {
      console.error('Error al recargar usuario:', error);
      setUsuario(null);
      return null;
    }
  };

  const refrescarUsuarioDesdeAPI = async (userId = null) => {
  try {
    const storedUser =
      localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    const storedToken =
      localStorage.getItem('token') || sessionStorage.getItem('token');

    if (storedUser && storedToken) {
      const { id } = userId ? { id: userId } : JSON.parse(storedUser);

      const res = await fetch(`${API_URL}/api/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!res.ok) throw new Error('Error al obtener el usuario actualizado');

      const data = await res.json();
      setUsuario(data);
      const storage = storedToken === localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('usuario', JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error al refrescar usuario desde API:', error);
  }
};


  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        login,
        logout,
        getToken,
        isAuthenticated,
        getAuthHeaders,
        reloadUserFromStorage,
        refrescarUsuarioDesdeAPI
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
};

export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error('useUsuario debe ser usado dentro de un UsuarioProvider');
  }
  return context;
}
