import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Registro.css';

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    tipoCuenta: 'developer',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!formData.correo.trim()) {
      nuevosErrores.correo = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      nuevosErrores.correo = 'El correo no tiene un formato válido';
    }

    if (!formData.contrasena.trim()) {
      nuevosErrores.contrasena = 'La contraseña es obligatoria';
    /* modificado en DT 01 05*/
    } else if (formData.contrasena.length < 8) {
      nuevosErrores.contrasena = 'La contraseña debe tener al menos 8 caracteres';
    } else if (/\s/.test(formData.contrasena)) {
      nuevosErrores.contrasena = 'La contraseña no puede contener espacios';
    }
    /* modificado en DT 01 05*/

    if (!formData.confirmarContrasena.trim()) {
      nuevosErrores.confirmarContrasena = 'Debes confirmar la contraseña';
    } else if (formData.contrasena !== formData.confirmarContrasena) {
      nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden';
    }

    if (!formData.tipoCuenta) {
      nuevosErrores.tipoCuenta = 'Debes seleccionar un tipo de cuenta';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setEnviando(true);
    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: formData.correo.trim(),
          contrasena: formData.contrasena,
          tipoCuenta: formData.tipoCuenta,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setExito(true);
        setTimeout(() => navigate('/'), 3000);
      } else if (response.status === 409) {
        setErrores({ correo: data.error || 'Ya existe una cuenta con ese correo' });
      } else {
        setErrores({ general: data.error || 'Error del servidor. Inténtalo de nuevo.' });
      }
    } catch {
      setErrores({ general: 'Error de conexión con el servidor' });
    } finally {
      setEnviando(false);
    }
  };

  const handleReset = () => {
    setFormData({ 
      correo: '', 
      contrasena: '', 
      confirmarContrasena: '',
      tipoCuenta: 'developer',
    });
    setErrores({});
  };

  if (exito) {
    return (
      <>
        <div className="registro-header">
          <h2>Crea tu cuenta</h2>
          <p>Únete a la comunidad de DevTest</p>
        </div>
        <div className="registro">
          <div className="registro-exito">
            <span className="registro-exito-icono">✓</span>
            <h3>¡Cuenta creada!</h3>
            <p>Tu cuenta se ha registrado correctamente.<br />Redirigiendo a inicio...</p>
            <Link to="/" className="registro-link-inicio">Ir al inicio ahora</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="registro-header">
        <h2>Crea tu cuenta</h2>
        <p>Únete a la comunidad de DevTest</p>
      </div>

      <div className="registro">
        {errores.general && (
          <div className="registro-error-general">{errores.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Campo correo */}
          <div className="registro-group">
            <label htmlFor="correo">
              Correo electrónico <span className="registro-required">*</span>
            </label>
            <input
              type="email"
              name="correo"
              id="correo"
              placeholder="tu@email.com"
              value={formData.correo}
              onChange={handleInputChange}
              className={errores.correo ? 'error' : ''}
              disabled={enviando}
              autoComplete="email"
            />
            {errores.correo && (
              <span className="registro-error-texto" role="alert">{errores.correo}</span>
            )}
          </div>

          {/* Campo contraseña */}
          <div className="registro-group">
            <label htmlFor="contrasena">
              Contraseña <span className="registro-required">*</span>
            </label>
            <input
              type="password"
              name="contrasena"
              id="contrasena"
              placeholder="Mínimo 8 caracteres, sin espacios"
              value={formData.contrasena}
              onChange={handleInputChange}
              className={errores.contrasena ? 'error' : ''}
              disabled={enviando}
              autoComplete="new-password"
            />
            {errores.contrasena && (
              <span className="registro-error-texto" role="alert">{errores.contrasena}</span>
            )}
          </div>

          {/* Campo confirmar contraseña */}
          <div className="registro-group">
            <label htmlFor="confirmarContrasena">
              Confirmar contraseña <span className="registro-required">*</span>
            </label>
            <input
              type="password"
              name="confirmarContrasena"
              id="confirmarContrasena"
              placeholder="Repite tu contraseña"
              value={formData.confirmarContrasena}
              onChange={handleInputChange}
              className={errores.confirmarContrasena ? 'error' : ''}
              disabled={enviando}
              autoComplete="new-password"
            />
            {errores.confirmarContrasena && (
              <span className="registro-error-texto" role="alert">{errores.confirmarContrasena}</span>
            )}
          </div>

          {/* Nuevo campo: Tipo de cuenta */}
          <div className="registro-group">
            <label htmlFor="tipoCuenta">
              Tipo de cuenta <span className="registro-required">*</span>
            </label>
            <select
              name="tipoCuenta"
              id="tipoCuenta"
              value={formData.tipoCuenta}
              onChange={handleInputChange}
              className={errores.tipoCuenta ? 'error' : ''}
              disabled={enviando}
            >
              <option value="developer">Developer</option>
              <option value="tester">Tester</option>
            </select>
            {errores.tipoCuenta && (
              <span className="registro-error-texto" role="alert">{errores.tipoCuenta}</span>
            )}
          </div>

          <div className="registro-botones">
            <button type="submit" className="registro-btn-submit" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Crear cuenta'}
            </button>
            <button type="button" className="registro-btn-cancelar" onClick={handleReset} disabled={enviando}>
              Limpiar
            </button>
          </div>

          <p className="registro-nota-required">
            <span className="registro-required">*</span> Campos obligatorios
          </p>
        </form>
      </div>
    </>
  );
}

export default Registro;