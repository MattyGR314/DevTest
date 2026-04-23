//creado en DT_09_01
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './VerFeedback.css';

function VerFeedback() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) {
      setCargando(false);
      return;
    }

    const fetchFeedback = async () => {
      try {
        const res = await fetch(`/api/proyectos/${id}/feedback`, {
          headers: {
            'X-User-Email': usuario
          }
        });

        if (res.status === 401) {
          setError('Debes iniciar sesión para ver el feedback.');
        } else if (res.status === 403) {
          setError('No eres el dueño de este proyecto. Solo los dueños pueden ver el feedback.');
        } else if (res.status === 404) {
          setError('El proyecto no existe.');
        } else if (!res.ok) {
          setError('Error al cargar el feedback.');
        } else {
          const data = await res.json();
          setFeedbackList(data);
          if (data.length === 0) {
            setError('No hay feedback registrado para este proyecto.');
          }
        }
      } catch (err) {
        setError('Error de conexión. Inténtalo de nuevo.');
      } finally {
        setCargando(false);
      }
    };

    fetchFeedback();
  }, [id, usuario]);

  if (!usuario) {
    return (
      <div className="ver-feedback">
        <div className="feedback-header">
          <Link to={`/resultado-consulta/${id}`} className="feedback-volver">← Volver al proyecto</Link>
          <h2>Ver feedback del proyecto</h2>
        </div>
        <div className="feedback-error-general">
          Debes <Link to="/iniciarSesion">iniciar sesión</Link> para ver el feedback.
        </div>
      </div>
    );
  }

  if (cargando) {
    return <div className="ver-feedback"><p>Cargando feedback...</p></div>;
  }

  return (
    <div className="ver-feedback">
      <div className="feedback-header">
        <Link to={`/resultado-consulta/${id}`} className="feedback-volver">← Volver al proyecto</Link>
        <h2>Feedback del proyecto</h2>
      </div>

      {error && !feedbackList.length && (
        <div className="feedback-error-general">{error}</div>
      )}

      {feedbackList.length > 0 && (
        <div className="feedback-lista">
          {feedbackList.map((item) => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-meta">
                <strong>{item.correo}</strong> el{' '}
                {new Date(item.fecha_creacion).toLocaleString()}
              </div>
              <div className="feedback-texto">{item.texto}</div>
              {item.archivo_path && (
                <div className="feedback-archivo">
                  <a href={`/uploads/${item.archivo_path}`} target="_blank" rel="noopener noreferrer">
                    📎 {item.nombre_fichero}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VerFeedback;