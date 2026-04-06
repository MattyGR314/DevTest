import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registro.css';

function Registro() {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
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

    if (!formData.confirmarContrasena || formData.confirmarContrasena.trim() === '') {
      nuevosErrores.confirmarContrasena = 'Debes confirmar la contraseña';
    } else if (formData.contrasena !== formData.confirmarContrasena) {
      nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: formData.correo, contrasena: formData.contrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuario registrado correctamente. Ya puedes iniciar sesión.');
        navigate('/iniciarsesion');
      } else if (response.status === 409) {
        setErrores({ correo: data.error });
      } else {
        setErrores({ correo: data.error || 'Error del servidor' });
      }
    } catch (error) {
      setErrores({ correo: 'Error de conexión con el servidor' });
    } finally {
      setEnviando(false);
    }
  };

  const handleReset = () => {
    setFormData({ correo: '', contrasena: '', confirmarContrasena: '' });
    setErrores({});
  };

  return (
    <div className="registro">
      <h2>Crear cuenta</h2>
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

        <div className="form-group">
          <label htmlFor="confirmarContrasena">
            Confirmar contraseña: <span className="required">*</span>
          </label>
          <input
            type="password"
            name="confirmarContrasena"
            id="confirmarContrasena"
            placeholder="Repite tu contraseña"
            value={formData.confirmarContrasena}
            onChange={handleInputChange}
            className={errores.confirmarContrasena ? 'error' : ''}
          />
          {errores.confirmarContrasena && (
            <span className="error-message" role="alert">
              ⚠️ {errores.confirmarContrasena}
            </span>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={enviando}>
            {enviando ? 'Registrando...' : 'Registrarse'}
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

export default Registro;
