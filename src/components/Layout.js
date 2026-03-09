import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <div className="encabezado">
        <span className="Dev">Dev</span><span className="Test">Test</span>

      </div>
      <nav className="navegacion">
        <Link to="/">Inicio</Link>
        <Link to="/subircodigo">Subir Código</Link>
      </nav>
      <main className="contenido">
        {children}
      </main>
    </div>
  );
}

export default Layout;
