import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './FeedbackProyecto.css';

function FeedbackProyecto() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [proyectoCargando, setProyectoCargando] = useState(true);
  const [proyectoError, setProyectoError] = useState('');
  const [texto, setTexto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  useEffect(() => {
    setProyectoCargando(true);
    fetch(`/api/proyectos/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not_found');
        return r.json();
      })
      .then(data => setProyecto(data))
      .catch(() => setProyectoError('El proyecto no existe o ha sido borrado.'))
      .finally(() => setProyectoCargando(false));
  }, [id]);

  // DT_08_5: sin sesión → pedir login
  if (!usuario) {
    return (
      <div className="feedback-proyecto">
        <div className="feedback-header">
          <Link to={`/resultado-consulta/${id}`} className="feedback-volver">← Volver al proyecto</Link>
          <h2>Enviar feedback</h2>
        </div>
        <div className="feedback-error-general">
          Debes <Link to="/iniciarSesion">iniciar sesión</Link> para poder enviar feedback.
        </div>
      </div>
    );
  }

  // DT_08_4: proyecto no encontrado
  if (!proyectoCargando && proyectoError) {
    return (
      <div className="feedback-proyecto">
        <div className="feedback-header">
          <Link to="/busqueda" className="feedback-volver">← Volver a búsqueda</Link>
          <h2>Enviar feedback</h2>
        </div>
        <div className="feedback-error-general">{proyectoError}</div>
      </div>
    );
  }

  const validar = () => {
    const nuevosErrores = {};
    // DT_08_3: comentarios vacíos
    if (!texto.trim()) {
      nuevosErrores.texto = 'Los comentarios no pueden estar vacíos';
    } else if (texto.trim().length > 1000) {
      nuevosErrores.texto = 'El feedback no puede exceder 1000 caracteres';
    }
    // DT_08_3: sin archivo
    if (!archivo) {
      nuevosErrores.archivo = 'Debes adjuntar al menos un documento';
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
      const formData = new FormData();
      formData.append('correo', usuario);
      formData.append('id_proyectos', id);
      formData.append('texto', texto.trim());
      formData.append('archivo', archivo);

      const respuesta = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        if (respuesta.status === 403) {
          setErrorGeneral('No estás inscrito en este proyecto. Inscríbete primero para poder enviar feedback.');
        } else if (respuesta.status === 404) {
          setErrorGeneral('El proyecto no existe o ha sido borrado.');
        } else {
          setErrorGeneral(datos.error || 'No se pudo enviar el feedback');
        }
        return;
      }

      setExito(true);
      setTexto('');
      setArchivo(null);
    } catch {
      setErrorGeneral('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="feedback-proyecto">
      <div className="feedback-header">
        <Link to={`/resultado-consulta/${id}`} className="feedback-volver">
          ← Volver al proyecto
        </Link>
        <h2>Enviar feedback</h2>
        {proyecto && <p className="feedback-nombre-proyecto">{proyecto.nombre}</p>}
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
            <label>Proyecto testeado</label>
            <span className="feedback-readonly">
              {proyectoCargando ? 'Cargando...' : (proyecto?.nombre || '')}
            </span>
          </div>

          <div className="feedback-group">
            <label>Tu correo</label>
            <span className="feedback-readonly">{usuario}</span>
          </div>

          <div className="feedback-group">
            <label htmlFor="texto-feedback">
              Comentarios <span className="feedback-required">*</span>
            </label>
            <textarea
              id="texto-feedback"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                if (errores.texto) setErrores(prev => ({ ...prev, texto: '' }));
                if (errorGeneral) setErrorGeneral('');
              }}
              placeholder="Describe tu experiencia con el proyecto, errores encontrados, sugerencias..."
              maxLength={1000}
              className={errores.texto ? 'error' : ''}
              disabled={enviando}
            />
            {errores.texto && <span className="feedback-error-texto">{errores.texto}</span>}
            <small>{texto.length}/1000 caracteres</small>
          </div>

          <div className="feedback-group">
            <label htmlFor="archivo-feedback">
              Documentos <span className="feedback-required">*</span>
            </label>
            <input
              type="file"
              id="archivo-feedback"
              onChange={(e) => {
                setArchivo(e.target.files[0] || null);
                if (errores.archivo) setErrores(prev => ({ ...prev, archivo: '' }));
              }}
              className={errores.archivo ? 'error' : ''}
              disabled={enviando}
            />
            {errores.archivo && <span className="feedback-error-texto">{errores.archivo}</span>}
          </div>

          <button type="submit" disabled={enviando || proyectoCargando} className="feedback-boton-enviar">
            {enviando ? 'Enviando...' : 'Enviar feedback'}
          </button>
        </form>
      )}
    </div>
  );
}

export default FeedbackProyecto;
