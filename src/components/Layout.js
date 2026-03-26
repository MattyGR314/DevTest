import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout({ children }) {
  const { usuario, logout } = useAuth();

  return (
    <div className="layout">

        <div className="encabezado d-flex justify-content-between">
          <div>
              <span className="Dev">Dev</span><span className="Test">Test</span>
          </div>
          

          <button class="navbar-toggler mt-4 me-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#menuRight" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    
              <img src="img/user_img.PNG" alt=""></img>
                    
          </button>
        </div>

        <nav className="navegacion d-flex justify-content-center">
          <Link to="/">Inicio</Link>
          <Link to="/subircodigo">Subir Código</Link>
          <Link to="/iniciarsesion">Iniciar Sesión</Link>
        </nav>

        <main className="contenido">
          {children}
        </main>

        <div className='footer text-center'>
          <p> Plataforma académica. Todos los derechos reservados</p>
        </div>

      <div className="offcanvas offcanvas-end"tabIndex="-1"id="menuRight">

          <div className="offcanvas-header">

            <h5 className="offcanvas-title">
              Menú DevTest
            </h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
            ></button>

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
