import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    return localStorage.getItem('usuario_correo') || null;
  });

  // 1. Inicializar tipoUsuario
  const [tipoUsuario, setTipoUsuario] = useState(() => {
    return localStorage.getItem('usuario_tipo') || null;
  });

  const login = (correo, tipo) => {
    localStorage.setItem('usuario_correo', correo);
    localStorage.setItem('usuario_tipo', tipo);
    setUsuario(correo);
    setTipoUsuario(tipo); // Actualización de estado
  };

  const logout = () => {
    localStorage.removeItem('usuario_correo');
    localStorage.removeItem('usuario_tipo');
    setUsuario(null);
    setTipoUsuario(null);
  };

  return (
    // 2. Exponer tipoUsuario en el value
    <AuthContext.Provider value={{ usuario, tipoUsuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}