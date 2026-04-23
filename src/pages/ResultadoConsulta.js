import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ResultadoConsulta.css';

function ResultadoConsulta() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tipoUsuario = (localStorage.getItem('usuario_tipo') || '').toLowerCase();

  const [proyecto, setProyecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [yaInscrito, setYaInscrito] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [mensajeStatus, setMensajeStatus] = useState(null);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    const obtenerProyecto = async () => {
      setError('');
      try {
        setCargando(true);
        const response = await fetch(`/api/proyectos?q=${encodeURIComponent(id)}&campo=id`);
        if (!response.ok) throw new Error("Proyecto no encontrado");
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
					setProyecto(null);
					setError('No existe un proyecto con ese ID.');
					return;
				}
        setProyecto(data);
        setNuevaDesc(data.descripcion || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    obtenerProyecto();
  }, [id]);

  useEffect(() => {
    if (!usuario || !id) return;

    fetch(`/api/inscripciones/check?correo=${encodeURIComponent(usuario)}&id_proyectos=${id}`)
      .then((r) => r.json())
      .then((data) => setYaInscrito(data.inscrito === true))
      .catch(() => {
        setYaInscrito(false);
      });
  }, [usuario, id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true' && usuario && proyecto && proyecto.correo && proyecto.correo === usuario) {
      setEditando(true);
    }
  }, [location, proyecto, usuario]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNuevaDesc(value);
    if (errores.descripcion) {
      setErrores(prev => ({ ...prev, descripcion: '' }));
    }
  };

  const handleGuardar = async () => {
    if (nuevaDesc.length > 500) {
      setErrores({ descripcion: 'La descripción no puede exceder 500 caracteres' });
      return;
    }

    try {
      const response = await fetch(`/api/proyectos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: nuevaDesc.trim() }),
      });

      if (response.ok) {
        setMensajeStatus({ tipo: 'success', texto: '¡Proyecto actualizado con éxito!' });
      } else {
        setMensajeStatus({ tipo: 'error', texto: 'Error al actualizar el proyecto.' });
      }
    } catch (error) {
      setMensajeStatus({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const botonInscripcion = () => {
    if (!usuario || !proyecto) return null;
    if (tipoUsuario !== 'tester') return null;
    if (proyecto.correo && proyecto.correo === usuario) return null;

    if (yaInscrito) {
      return (
        <button
          type="button"
          className="btn-inscripcion btn-inscripcion--desactivado"
          disabled
        >
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

  const fichero = proyecto?.nombre_fichero || "No hay fichero adjunto";
  const esCreador = usuario && proyecto?.correo && proyecto.correo === usuario;
  const textoDescripcion = proyecto?.descripcion || "Sin descripción registrada";
  const descripcionLargaUnaPalabra = (() => {
    const texto = (proyecto?.descripcion || "").trim();
    if (!texto) return false;
    const palabras = texto.split(/\s+/);
    return palabras.length === 1 && texto.length >= 40;
  })();

  return (
    <section className="resultado-consulta">
      <div className="resultado-header">
        <h2>Detalle del proyecto</h2>
        <Link to="/busqueda" className="resultado-volver">← Volver a búsqueda</Link>
      </div>

      {mensajeStatus && (
        <div className={`resultado-mensaje-status ${mensajeStatus.tipo}`}>
          <h3>{mensajeStatus.texto}</h3>
          <button onClick={() => navigate('/')} className="btn-aceptar-status">
            Aceptar y volver al inicio
          </button>
        </div>
      )}

      {cargando && <p className="resultado-info text-center">Cargando proyecto...</p>}
      {!cargando && error && <p className="resultado-error text-center">{error}</p>}

      {!cargando && !error && proyecto && !mensajeStatus && (
        <article className="resultado-card">
          <p className="resultado-id">Proyecto #{proyecto.id}</p>
          <h3>{proyecto.nombre || 'Sin nombre'}</h3>

          <div className="resultado-meta">
            <p><strong>Fecha de creación:</strong> {formatearFecha(proyecto.fecha_creacion)}</p>
            
            <div className="resultado-descripcion-container">
              <strong>Descripción:</strong> 
              {editando ? (
                <div className="form-group">
                  <textarea 
                    value={nuevaDesc} 
                    onChange={handleInputChange}
                    maxLength="500"
                    className={`resultado-textarea ${errores.descripcion ? 'error' : ''}`}
                  />
                  {errores.descripcion && (
                    <span className="error-message">
                      ⚠️ {errores.descripcion}
                    </span>
                  )}
                  <small className="char-counter">Máximo 500 caracteres</small>
                </div>
              ) : (
                descripcionLargaUnaPalabra ? (
                  <div className="descripcion-scroll-box" title="Descripción larga con desplazamiento horizontal">
                    {textoDescripcion}
                  </div>
                ) : (
                  <p className="texto-descripcion">{textoDescripcion}</p>
                )
              )}
            </div>
            
            <p><strong>Fichero:</strong> {fichero}</p>
          </div>

          <div className="resultado-acciones">
            {yaInscrito ? (
							<Link to={`/feedback/${proyecto.id}`} className="btn-feedback">
								Enviar feedback
							</Link>
						) : (
							<Link to={`/seleccionarproyecto/${proyecto.id}`} className="btn-participar">
								Inscribirse como Tester
							</Link>
						)}

            {/* DT_09_01 Nuevo botón solo para el dueño */}
            {esCreador && (
              <Link to={`/proyecto/${proyecto.id}/ver-feedback`} className="btn-ver-feedback">
                Ver feedback recibido
              </Link>
            )}
            
            {esCreador ? (
              <div className="edicion-botones">
                {!editando ? (
                  <button onClick={() => setEditando(true)} className="btn-modificar">
                    Modificar Proyecto
                  </button>
                ) : (
                  <div className="edicion-botones-acciones">
                    <button onClick={handleGuardar} className="btn-guardar">
                      Guardar Cambios
                    </button>
                    <button onClick={() => { setEditando(false); setErrores({}); }} className="btn-cancelar">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !editando && (
                <div className="inscripcion-container">
                  {botonInscripcion()}

                  {!usuario && (
                    <p className="resultado-aviso-login">
                      <Link to="/iniciarSesion" className="resultado-link-login">Inicia sesión</Link> para inscribirte como tester.
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </article>
      )}
    </section>
  );
}

export default ResultadoConsulta;