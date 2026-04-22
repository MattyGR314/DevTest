import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SeleccionarProyecto.css';

function SeleccionarProyecto() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [formData, setFormData] = useState({ nombre: '', correo: usuario || '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  useEffect(() => {
    fetch(`/api/proyectos/${id}`)
      .then(r => r.json())
      .then(data => setNombreProyecto(data.nombre || ''))
      .catch(() => {});
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
    if (errorGeneral) setErrorGeneral('');
  };

  const validar = () => {
    const nuevosErrores = {};
    
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      nuevosErrores.correo = 'El correo no es válido';
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setEnviando(true);
    setErrorGeneral('');
    
    try {
      const respuesta = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim(),
          id_proyectos: parseInt(id),
        }),
      });
      
      const datos = await respuesta.json();
      
      if (!respuesta.ok) {
        setErrorGeneral(datos.error || 'No se pudo guardar la inscripción');
        return;
      }
      
      setExito(true);
    } catch {
      setErrorGeneral('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  // Pantalla de éxito encapsulada
  if (exito) {
    return (
      <section className="seleccionar-proyecto">
        <div className="inscripcion-exito">
          <span className="inscripcion-exito-icono">✓</span>
          <h3>¡Inscripción completada!</h3>
          <p>Te has inscrito correctamente como tester en <strong>{nombreProyecto}</strong>.</p>
          <div className="inscripcion-exito-acciones">
            <Link to="/busqueda" className="btn-inscripcion-volver">Volver a búsqueda</Link>
            <button type="button" onClick={() => navigate('/')} className="btn-inscripcion-inicio">
              Ir al inicio
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="seleccionar-proyecto">
      <div className="inscripcion-header">
        <Link to={`/resultado-consulta/${id}`} className="inscripcion-volver">
          ← Volver al proyecto
        </Link>
        <h2>Inscribirse como Tester</h2>
        {nombreProyecto && <p className="inscripcion-nombre-proyecto">{nombreProyecto}</p>}
      </div>

      <div className="inscripcion-form-card">
        {errorGeneral && (
          <div className="inscripcion-error-general">{errorGeneral}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="inscripcion-group">
            <label htmlFor="nombre">
              Nombre completo <span className="inscripcion-required">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              placeholder="Tu nombre completo"
              value={formData.nombre}
              onChange={handleInputChange}
              className={errores.nombre ? 'error' : ''}
              disabled={enviando}
              maxLength={100}
            />
            {errores.nombre && <span className="inscripcion-error-texto">{errores.nombre}</span>}
          </div>

          <div className="inscripcion-group">
            <label htmlFor="correo">
              Correo electrónico <span className="inscripcion-required">*</span>
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
            />
            {errores.correo && <span className="inscripcion-error-texto">{errores.correo}</span>}
          </div>

          <button type="submit" className="inscripcion-btn-submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Confirmar inscripción'}
          </button>

          <p className="inscripcion-nota">
            <span className="inscripcion-required">*</span> Campos obligatorios
          </p>
        </form>
      </div>
    </section>
  );
}

export default SeleccionarProyecto;