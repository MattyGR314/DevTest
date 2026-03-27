import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    return localStorage.getItem('usuario_correo') || null;
  });

  const login = (correo) => {
    localStorage.setItem('usuario_correo', correo);
    setUsuario(correo);
  };

  const logout = () => {
    localStorage.removeItem('usuario_correo');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
