import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ResultadoConsulta.css';

function ResultadoConsulta() {
  const { id } = useParams();
  const { usuario, tipoUsuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      try {
        setCargando(true);
        const response = await fetch(`/api/proyectos/${id}`);
        if (!response.ok) throw new Error("Proyecto no encontrado");
        const data = await response.json();
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
    return new Date(fecha).toLocaleDateString();
  };

  const botonInscripcion = () => {
    if (!usuario || !proyecto) return null;
    if ((tipoUsuario || '').toLowerCase() !== 'tester') return null;
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

  // VARIABLE CORREGIDA SEGÚN TU BACKEND: nombre_fichero
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
    <section className="resultado-consulta" style={{ padding: '20px' }}>
      <div className="resultado-header" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
        <h2>Detalle del proyecto</h2>
        <Link to="/busqueda" className="resultado-volver">← Volver a búsqueda</Link>
      </div>

      {mensajeStatus && (
        <div style={{ 
          backgroundColor: mensajeStatus.tipo === 'success' ? '#28a745' : '#dc3545', 
          color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', 
          maxWidth: '600px', margin: '0 auto 20px auto' 
        }}>
          <h3>{mensajeStatus.texto}</h3>
          <button onClick={() => navigate('/')} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer', backgroundColor: 'white', border: 'none', borderRadius: '4px' }}>
            Aceptar y volver al inicio
          </button>
        </div>
      )}

      {cargando && <p className="resultado-info" style={{ textAlign: 'center' }}>Cargando proyecto...</p>}
      {!cargando && error && <p className="resultado-error" style={{ textAlign: 'center' }}>{error}</p>}

      {!cargando && !error && proyecto && !mensajeStatus && (
        <article className="resultado-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p className="resultado-id">Proyecto #{proyecto.id}</p>
          <h3 style={{ color: 'white' }}>{proyecto.nombre || 'Sin nombre'}</h3>

          <div className="resultado-meta">
            <p style={{ color: 'white' }}><strong>Fecha de creación:</strong> {formatearFecha(proyecto.fecha_creacion)}</p>
            
            <div style={{ color: 'white', marginTop: '15px' }}>
              <strong>Descripción:</strong> 
              {editando ? (
                <div className="form-group">
                  <textarea 
                    value={nuevaDesc} 
                    onChange={handleInputChange}
                    maxLength="500"
                    className={errores.descripcion ? 'error' : ''}
                    style={{ width: '100%', marginTop: '10px', backgroundColor: '#222', color: 'white', padding: '10px', minHeight: '120px', borderRadius: '5px' }}
                  />
                  {errores.descripcion && (
                    <span className="error-message" role="alert" style={{ color: '#ff4d4d', display: 'block', marginTop: '5px' }}>
                      ⚠️ {errores.descripcion}
                    </span>
                  )}
                  <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>Máximo 500 caracteres</small>
                </div>
              ) : (
                descripcionLargaUnaPalabra ? (
                  <div className="descripcion-scroll-box" title="Descripción larga con desplazamiento horizontal">
                    {textoDescripcion}
                  </div>
                ) : (
                  <p style={{ color: 'white', marginTop: '5px' }}>{textoDescripcion}</p>
                )
              )}
            </div>
            
            <p style={{ color: 'white', marginTop: '10px' }}><strong>Fichero:</strong> {fichero}</p>
          </div>

          <div className="resultado-acciones" style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px' }}>
            <div className="edicion-botones">
              {!editando ? (
                <button
                  onClick={() => setEditando(true)}
                  className="busqueda-boton"
                  disabled={!esCreador}
                  title={!esCreador ? 'Solo el creador del proyecto puede modificarlo' : ''}
                  style={{ backgroundColor: esCreador ? '#f39c12' : '#555', color: 'white', border: 'none', padding: '10px 20px', width: '100%', cursor: esCreador ? 'pointer' : 'not-allowed', opacity: esCreador ? 1 : 0.5 }}
                >
                  Modificar Descripción
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleGuardar} className="busqueda-boton" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', flex: 1 }}>
                    Guardar Cambios
                  </button>
                  <button onClick={() => { setEditando(false); setErrores({}); }} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', flex: 1 }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            
            <div className='detalles-boton' style={{ marginTop: '10px' }}> 
              {usuario && usuario === proyecto.correo && (
                <Link 
                  to={`/detalles-proyecto/${proyecto.id}`} 
                  className="detalles-proyecto-boton"
                  style={{ 
                    display: 'block', 
                    width: '100%', 
                    padding: '5px 20px', 
                    color: 'white', 
                    textAlign: 'center', 
                    textDecoration: 'none', 
                    border: 'none', 
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  Añadir detalles
                </Link>
              )}
            </div>
              

            {!editando && (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                {botonInscripcion()}

                {!usuario && (
                  <p className="resultado-aviso-login" style={{ color: 'white', marginTop: '15px', fontSize: '0.85em' }}>
                    <Link to="/iniciarSesion" style={{ color: '#3498db' }}>Inicia sesión</Link> para inscribirte como tester.
                  </p>
                )}
              </div>
            )}
          </div>
        </article>
      )}
    </section>
  );
}

export default ResultadoConsulta;