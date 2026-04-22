import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    return localStorage.getItem('usuario_correo') || null;
  });
  const [tipoUsuario, setTipoUsuario] = useState(() => {
    return localStorage.getItem('usuario_tipo') || null;
  });

  const login = (correo, tipo = null) => {
    localStorage.setItem('usuario_correo', correo);
    if (tipo) {
      localStorage.setItem('usuario_tipo', tipo);
    } else {
      localStorage.removeItem('usuario_tipo');
    }
    setUsuario(correo);
    setTipoUsuario(tipo);
  };

  const logout = () => {
    localStorage.removeItem('usuario_correo');
    localStorage.removeItem('usuario_tipo');
    setUsuario(null);
    setTipoUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, tipoUsuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
