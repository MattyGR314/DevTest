import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">

        <div className="encabezado d-flex justify-content-between">
          <div>
              <span className="Dev">Dev</span><span className="Test">Test</span>
          </div>
        </div>

        <nav className="navegacion d-flex justify-content-center">
          <Link to="/">Inicio</Link>
          <Link to="/subircodigo">Subir Código</Link>
          <Link to="/iniciarSesion">Iniciar Sesión</Link>
        </nav>

        <main className="contenido">
          {children}
        </main>

        <div className='footer text-center'>
          <p> Plataforma académica. Todos los derechos reservados</p>
        </div>
    </div>

    
  );
}

export default Layout;
