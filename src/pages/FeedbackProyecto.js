import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './FeedbackProyecto.css';

function FeedbackProyecto() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [texto, setTexto] = useState('');
  const [correo, setCorreo] = useState(usuario || '');
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

  const validar = () => {
    const nuevosErrores = {};
    if (!correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = 'El correo no es válido';
    }
    if (!texto.trim()) {
      nuevosErrores.texto = 'El feedback no puede estar vacío';
    } else if (texto.trim().length > 1000) {
      nuevosErrores.texto = 'El feedback no puede exceder 1000 caracteres';
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
      const respuesta = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correo.trim(),
          id_proyectos: parseInt(id),
          texto: texto.trim(),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorGeneral(datos.error || 'No se pudo enviar el feedback');
        return;
      }

      setExito(true);
      setTexto('');
    } catch {
      setErrorGeneral('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleChange = (setter, campo) => (e) => {
    setter(e.target.value);
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: '' }));
    if (errorGeneral) setErrorGeneral('');
  };

  return (
    <div className="feedback-proyecto">
      <div className="feedback-header">
        <Link to={`/resultado-consulta/${id}`} className="feedback-volver">
          ← Volver al proyecto
        </Link>
        <h2>Enviar feedback</h2>
        {nombreProyecto && <p className="feedback-nombre-proyecto">{nombreProyecto}</p>}
      </div>

      {exito ? (
        <div className="feedback-exito">
          <span className="feedback-exito-icono">✓</span>
          <p>¡Feedback enviado correctamente!</p>
          <Link to="/busqueda" className="feedback-link-busqueda">
            Volver a búsqueda
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="feedback-form" noValidate>
          {errorGeneral && (
            <div className="feedback-error-general">{errorGeneral}</div>
          )}

          <div className="feedback-group">
            <label htmlFor="correo-feedback">
              Tu correo <span className="feedback-required">*</span>
            </label>
            <input
              type="email"
              id="correo-feedback"
              value={correo}
              onChange={handleChange(setCorreo, 'correo')}
              placeholder="tu@email.com"
              className={errores.correo ? 'error' : ''}
              disabled={enviando}
            />
            {errores.correo && <span className="feedback-error-texto">{errores.correo}</span>}
          </div>

          <div className="feedback-group">
            <label htmlFor="texto-feedback">
              Feedback <span className="feedback-required">*</span>
            </label>
            <textarea
              id="texto-feedback"
              value={texto}
              onChange={handleChange(setTexto, 'texto')}
              placeholder="Describe tu experiencia con el proyecto, errores encontrados, sugerencias..."
              maxLength={1000}
              className={errores.texto ? 'error' : ''}
              disabled={enviando}
            />
            {errores.texto && <span className="feedback-error-texto">{errores.texto}</span>}
            <small>{texto.length}/1000 caracteres</small>
          </div>

          <button type="submit" disabled={enviando} className="feedback-boton-enviar">
            {enviando ? 'Enviando...' : 'Enviar feedback'}
          </button>
        </form>
      )}
    </div>
  );
}

export default FeedbackProyecto;
