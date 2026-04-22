import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DetallesProyecto.css';

const PLATAFORMAS = ['Windows', 'Linux', 'Mac', 'Multiplataforma', 'Android', 'iOS'];

function DetallesProyecto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [formData, setFormData] = useState({ version: '', plataforma: '', instrucciones: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProyecto, resDetalles] = await Promise.all([
          fetch(`/api/proyectos/${id}`),
          fetch(`/api/proyectos/${id}/detalles`),
        ]);

        const proyecto = await resProyecto.json();
        if (!resProyecto.ok) {
          setErrorGeneral('Proyecto no encontrado');
          return;
        }

        setNombreProyecto(proyecto.nombre || '');

        if (resDetalles.ok) {
          const detalles = await resDetalles.json();
          setFormData({
            version: detalles.version || '',
            plataforma: detalles.plataforma || '',
            instrucciones: detalles.instrucciones || '',
          });
        }
      } catch {
        setErrorGeneral('Error al cargar los datos del proyecto');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
    if (errorGeneral) setErrorGeneral('');
  };

  const validar = () => {
    const nuevosErrores = {};
    if (formData.version && formData.version.trim().length > 50) {
      nuevosErrores.version = 'La versión no puede superar 50 caracteres';
    }
    if (formData.instrucciones && formData.instrucciones.trim().length > 2000) {
      nuevosErrores.instrucciones = 'Las instrucciones no pueden superar 2000 caracteres';
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
      const respuesta = await fetch(`/api/proyectos/${id}/detalles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: usuario,
          version: formData.version,
          plataforma: formData.plataforma,
          instrucciones: formData.instrucciones,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorGeneral(datos.error || 'No se pudieron guardar los detalles');
        return;
      }

      navigate('/busqueda');
    } catch {
      setErrorGeneral('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <section className="detalles-proyecto">
        <p className="detalles-cargando">Cargando...</p>
      </section>
    );
  }

  return (
    <section className="detalles-proyecto">
      <div className="detalles-header">
        <Link to="/busqueda" className="detalles-volver">← Volver a búsqueda</Link>
        <h2>Detalles del proyecto</h2>
        {nombreProyecto && <p className="detalles-nombre-proyecto">{nombreProyecto}</p>}
      </div>

      <div className="detalles-form-card">
        {errorGeneral && (
          <div className="detalles-error-general">{errorGeneral}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="detalles-group">
            <label htmlFor="version">Versión</label>
            <input
              type="text"
              name="version"
              id="version"
              placeholder="Ej: 1.0.0"
              value={formData.version}
              onChange={handleChange}
              className={errores.version ? 'error' : ''}
              disabled={enviando}
              maxLength={50}
            />
            {errores.version && <span className="detalles-error-texto">{errores.version}</span>}
          </div>

          <div className="detalles-group">
            <label htmlFor="plataforma">Plataforma</label>
            <select
              name="plataforma"
              id="plataforma"
              value={formData.plataforma}
              onChange={handleChange}
              disabled={enviando}
            >
              <option value="">Sin especificar</option>
              {PLATAFORMAS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="detalles-group">
            <label htmlFor="instrucciones">Instrucciones de uso</label>
            <textarea
              name="instrucciones"
              id="instrucciones"
              placeholder="Explica cómo ejecutar o usar tu proyecto..."
              value={formData.instrucciones}
              onChange={handleChange}
              className={errores.instrucciones ? 'error' : ''}
              disabled={enviando}
              maxLength={2000}
            />
            {errores.instrucciones && (
              <span className="detalles-error-texto">{errores.instrucciones}</span>
            )}
            <small>Máximo 2000 caracteres</small>
          </div>

          <div className="detalles-acciones">
            <Link to="/busqueda" className="detalles-btn-cancelar">Cancelar</Link>
            <button type="submit" className="detalles-btn-submit" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar detalles'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default DetallesProyecto;
