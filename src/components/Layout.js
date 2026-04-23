import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout({ children }) {
  const { usuario, logout } = useAuth();

  return (
    <div className="layout">

      {/* Cabecera unificada y fija */}
      <header className="header-principal">
        
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <span className="Dev">Dev</span><span className="Test">Test</span>
          </Link>
        </div>

        <nav className="navegacion-principal">
          <Link to="/">Inicio</Link>
          <Link to="/subircodigo">Subir Código</Link>
          <Link to="/busqueda">Búsqueda</Link>
          {/* Se elimina <Link to="/registro">Registrar</Link> de aquí */}
        </nav>

        <div className="user-actions">
          {!usuario ? (
            <>
              <Link to="/registro" className="btn-register-header">
                Registrar
              </Link>
              <Link to="/iniciarSesion" className="btn-login-header">
                Iniciar Sesión
              </Link>
            </>
          ) : (
            <div className="user-info d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#menuRight" style={{cursor: 'pointer'}}>
              <i className="bi bi-person-circle me-2"></i>
              <span>{usuario}</span>
            </div>
          )}
        </div>

      </header>

      <main className="contenido">
        {children}
      </main>

      <div className='footer text-center'>
        <p>Plataforma académica. Todos los derechos reservados</p>
      </div>

      {/* Menú lateral (Offcanvas) */}
      <div className="offcanvas offcanvas-end text-dark" tabIndex="-1" id="menuRight">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Menú DevTest</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          {usuario ? (
            <div>
              <p>Hola, {usuario}</p>
              <button type="button" onClick={logout} className="btn btn-outline-danger btn-sm">
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