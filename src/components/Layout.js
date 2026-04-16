import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout({ children }) {
  const { usuario, logout } = useAuth(); //

  return (
    <div className="layout">
        {/* Encabezado con botón de inicio de sesión condicional */}
        <div className="encabezado d-flex justify-content-between align-items-center">
          <div>
              <span className="Dev">Dev</span><span className="Test">Test</span>
          </div>

          {!usuario ? (
            <Link to="/iniciarSesion" className="btn-login-header">
              Iniciar Sesión
            </Link>
          ) : (
            <div className="user-info d-flex align-items-center">
              <i className="bi bi-person-circle me-2"></i>
              <span>{usuario}</span>
            </div>
          )}
        </div>

        {/* Barra de navegación sin el enlace de Iniciar Sesión */}
        <nav className="navegacion d-flex justify-content-center">
          <Link to="/">Inicio</Link>
          <Link to="/subircodigo">Subir Código</Link>
        </nav>

        <main className="contenido">
          {children}
        </main>

        <div className='footer text-center'>
          <p> Plataforma académica. Todos los derechos reservados</p>
        </div>

        {/* Estructura original del menú lateral */}
        <div className="offcanvas offcanvas-end" tabIndex="-1" id="menuRight">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menú DevTest</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div className="offcanvas-body">
            {usuario ? (
              <div>
                <p>Hola, {usuario}</p>
                <button type="button" onClick={logout} className="btn btn-outline-secondary btn-sm">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <p>No has iniciado sesión</p>
            )}
          </div>
        </div>
    </div>
  );
}

export default Layout;