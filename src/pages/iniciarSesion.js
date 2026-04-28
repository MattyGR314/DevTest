import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './iniciarSesion.css';

function IniciarSesion() {
  const [formData, setFormData] = useState({ correo: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const { usuario, login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    if (!formData.correo || formData.correo.trim() === '') {
      nuevosErrores.correo = 'El correo electrónico es obligatorio';
    } else {
      const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regexCorreo.test(formData.correo)) {
        nuevosErrores.correo = 'El correo no tiene un formato válido';
      }
    }

    if (!formData.contrasena || formData.contrasena.trim() === '') {
      nuevosErrores.contrasena = 'La contraseña es obligatoria';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: formData.correo, contrasena: formData.contrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.correo, data.tipo || data.rol || data.usuario?.tipo || null);
        navigate('/');
      } else {
        if (response.status === 404) setErrores({ correo: data.error });
        else if (response.status === 401) setErrores({ contrasena: data.error });
        else setErrores({ correo: data.error || 'Error del servidor' });
      }
    } catch (error) {
      setErrores({ correo: 'Error de conexión con el servidor' });
    } finally {
      setEnviando(false);
    }
  };

//  const handleReset = () => {
//    setFormData({ correo: '', contrasena: '' });
//    setErrores({});
//  };

  return (
    <div className="iniciar-sesion-container">
      <div className="iniciar-sesion">
        <h2>Iniciar <span className='Sesion'>Sesión</span></h2>
        {usuario && (
          <div className="info-message">
            Ya has iniciado sesión como <strong>{usuario}</strong>. El botón de iniciar sesión está desactivado.
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="correo">
              Correo electrónico <span className="required">*</span>
            </label>
            <input
              type="email"
              name="correo"
              id="correo"
              placeholder="Ingrese su correo electrónico"
              value={formData.correo}
              onChange={handleInputChange}
              className={errores.correo ? 'error' : ''}
              disabled={!!usuario}
            />
            {errores.correo && (
              <span className="error-message" role="alert">{errores.correo}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">
              Contraseña <span className="required">*</span>
            </label>
            <input
              type="password"
              name="contrasena"
              id="contrasena"
              placeholder="Ingrese su contraseña"
              value={formData.contrasena}
              onChange={handleInputChange}
              className={errores.contrasena ? 'error' : ''}
              disabled={!!usuario}
            />
            {errores.contrasena && (
              <span className="error-message" role="alert">{errores.contrasena}</span>
            )}
          </div>

           <div className="form-buttons">
            {/*<button type="button" onClick={handleReset} disabled={enviando} className="btn-clear">
              Limpiar
            </button> */}

            <button type="submit" disabled={enviando || !!usuario} className="btn-primary-login">
              {enviando ? 'Comprobando...' : 'Iniciar Sesión'}
            </button>
            <button type="button" onClick={() => navigate('/')} disabled={enviando} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IniciarSesion;