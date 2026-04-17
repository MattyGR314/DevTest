import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ResultadoConsulta.css';

function ResultadoConsulta() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [yaInscrito, setYaInscrito] = useState(false);

  // Carga el proyecto
  useEffect(() => {
    const fetchProyecto = async () => {
      setCargando(true);
      setError('');
      try {
        const response = await fetch(`/api/proyectos/${id}`);
        if (!response.ok) throw new Error('No se pudo obtener el proyecto');
        setProyecto(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchProyecto();
  }, [id]);

  // Comprueba si el usuario ya está inscrito en este proyecto
  useEffect(() => {
    if (!usuario || !id) return;
    fetch(`/api/inscripciones/check?correo=${encodeURIComponent(usuario)}&id_proyectos=${id}`)
      .then(r => r.json())
      .then(data => setYaInscrito(data.inscrito === true))
      .catch(() => {});
  }, [usuario, id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const descripcion = proyecto?.descripcion || 'Sin descripción registrada';
  const fichero = proyecto?.nombre_fichero || proyecto?.archivo_path || 'Sin fichero';

  // Estado del botón de inscripción
  const botonInscripcion = () => {
    if (!usuario) return null; // No logueado: no se muestra

    if (yaInscrito) {
      return (
        <button type="button" className="btn-inscripcion btn-inscripcion--desactivado" disabled>
          Ya inscrito en este proyecto
        </button>
      );
    }

    return (
      <Link to={`/seleccionarproyecto/${proyecto.id}`} className="btn-inscripcion">
        Inscribirse como Tester
      </Link>
    );
  };

  return (
    <section className="resultado-consulta">
      <div className="resultado-header">
        <h2>Detalle del proyecto</h2>
        <Link to="/busqueda" className="resultado-volver">← Volver a búsqueda</Link>
      </div>

      {cargando && <p className="resultado-info">Cargando proyecto...</p>}
      {!cargando && error && <p className="resultado-error">{error}</p>}

      {!cargando && !error && proyecto && (
        <article className="resultado-card">
          <p className="resultado-id">Proyecto #{proyecto.id}</p>
          <h3>{proyecto.nombre || 'Sin nombre'}</h3>

          <div className="resultado-meta">
            <p><strong>Fecha:</strong> {formatearFecha(proyecto.fecha_creacion)}</p>
            <p><strong>Descripción:</strong> {descripcion}</p>
            <p><strong>Fichero:</strong> {fichero}</p>
          </div>

          <div className="resultado-acciones">
            {botonInscripcion()}
            {!usuario && (
              <p className="resultado-aviso-login">
                <Link to="/iniciarSesion" className="resultado-link-login">Inicia sesión</Link>
                {' '}para inscribirte como tester en este proyecto.
              </p>
            )}
          </div>
        </article>
      )}
    </section>
  );
}

export default ResultadoConsulta;
