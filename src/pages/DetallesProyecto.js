import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DetallesProyecto.css';

function DetallesProyecto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [formData, setFormData] = useState({ fechaLimite: '', numeroTesters: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [exito, setExito] = useState('');
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
            fechaLimite: detalles.fecha_limite ? detalles.fecha_limite.split('T')[0] : '',
            numeroTesters: detalles.numero_testers || '',
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
    if (exito) setExito('');
  };

  const validar = () => {
    const nuevosErrores = {};
    const { fechaLimite, numeroTesters } = formData;

    if (!fechaLimite && !numeroTesters) {
      setErrorGeneral('Debes rellenar al menos uno de los campos.');
      return false;
    }

    if (fechaLimite) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaSeleccionada = new Date(`${fechaLimite}T00:00:00`); 
      
      if (fechaSeleccionada <= hoy) {
        nuevosErrores.fechaLimite = 'La fecha debe ser posterior a la actual. Vuelve a introducir una fecha.';
      }
    }

    if (numeroTesters) {
      const num = Number(numeroTesters);
      if (!Number.isInteger(num) || num <= 0) {
        nuevosErrores.numeroTesters = 'El número de testers debe ser un entero positivo mayor que 0. Vuelve a introducir un número.';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuario) {
      setErrorGeneral('Inicia sesión para continuar.');
      return;
    }

    if (!validar()) return;

    setEnviando(true);
    setErrorGeneral('');
    setExito('');

    try {
      const respuesta = await fetch(`/api/proyectos/${id}/detalles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: usuario,
          fecha_limite: formData.fechaLimite || null,
          numero_testers: formData.numeroTesters ? parseInt(formData.numeroTesters, 10) : null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        if (respuesta.status === 403 || (datos.error && datos.error.toLowerCase().includes('dueño'))) {
          setErrorGeneral('Solo el dueño del proyecto puede añadir detalles.');
        } else {
          setErrorGeneral(datos.error || 'No se pudieron guardar los detalles');
        }
        return;
      }

      setExito('Operación exitosa: Detalles asociados al proyecto.');
      // CORRECCIÓN 1: Redirigir a la ruta correcta tras guardar
      setTimeout(() => navigate(`/resultado-consulta/${id}`), 2000);
      
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
        <Link to={`/resultado-consulta/${id}`} className="detalles-volver">← Volver al proyecto</Link>
        <p className="detalles-nombre-proyecto">Detalles del proyecto</p>
        {nombreProyecto && <h2>{nombreProyecto}</h2>}
      </div>

      <div className="detalles-form-card">
        {errorGeneral && (
          <div className="detalles-error-general">{errorGeneral}</div>
        )}
        
        {exito && (
          <div className="detalles-error-general" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', borderLeftColor: '#28a745', color: '#28a745' }}>
            {exito}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="detalles-group">
            <label htmlFor="fechaLimite">Fecha Límite</label>
            <input
              type="date"
              name="fechaLimite"
              id="fechaLimite"
              value={formData.fechaLimite}
              onChange={handleChange}
              className={errores.fechaLimite ? 'error' : ''}
              disabled={enviando}
            />
            {errores.fechaLimite && <span className="detalles-error-texto">{errores.fechaLimite}</span>}
          </div>

          <div className="detalles-group">
            <label htmlFor="numeroTesters">Número de Testers</label>
            <input
              type="number"
              name="numeroTesters"
              id="numeroTesters"
              placeholder="Ej: 5"
              value={formData.numeroTesters}
              onChange={handleChange}
              className={errores.numeroTesters ? 'error' : ''}
              disabled={enviando}
              min="1"
              step="1"
            />
            {errores.numeroTesters && <span className="detalles-error-texto">{errores.numeroTesters}</span>}
          </div>

          <div className="detalles-acciones">
            {/* CORRECCIÓN 3: Enlace del botón cancelar */}
            <Link to={`/resultado-consulta/${id}`} className="detalles-btn-cancelar">Cancelar</Link>
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