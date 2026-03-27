import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './IniciarSesion.css';

function IniciarSesion() {
  const [formData, setFormData] = useState({ correo: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
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
        login(data.correo);
        navigate('/');
      } else {
        if (response.status === 404) {
          setErrores({ correo: data.error });
        } else if (response.status === 401) {
          setErrores({ contrasena: data.error });
        } else {
          setErrores({ correo: data.error || 'Error del servidor' });
        }
      }
    } catch (error) {
      setErrores({ correo: 'Error de conexión con el servidor' });
    } finally {
      setEnviando(false);
    }
  };

  const handleReset = () => {
    setFormData({ correo: '', contrasena: '' });
    setErrores({});
  };

  return (
    <div className="iniciar-sesion">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="correo">
            Correo electrónico: <span className="required">*</span>
          </label>
          <input
            type="email"
            name="correo"
            id="correo"
            placeholder="tu@email.com"
            value={formData.correo}
            onChange={handleInputChange}
            className={errores.correo ? 'error' : ''}
          />
          {errores.correo && (
            <span className="error-message" role="alert">
              ⚠️ {errores.correo}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contrasena">
            Contraseña: <span className="required">*</span>
          </label>
          <input
            type="password"
            name="contrasena"
            id="contrasena"
            placeholder="Tu contraseña"
            value={formData.contrasena}
            onChange={handleInputChange}
            className={errores.contrasena ? 'error' : ''}
          />
          {errores.contrasena && (
            <span className="error-message" role="alert">
              ⚠️ {errores.contrasena}
            </span>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={enviando}>
            {enviando ? 'Comprobando...' : 'Iniciar Sesión'}
          </button>
          <button type="button" onClick={handleReset} disabled={enviando}>
            Cancelar
          </button>
        </div>

        <div className="required-note">
          <span className="required">*</span> Campos obligatorios
        </div>
      </form>
    </div>
  );
}

export default IniciarSesion;
