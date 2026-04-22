import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Busqueda.css';

const Busqueda = () => {
  const [termino, setTermino] = useState('');
  const [campo, setCampo] = useState('nombre');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para la edición de descripciones (DT_10_T1)
  const [proyectoEnEdicion, setProyectoEnEdicion] = useState(null);
  const [descripcionEditada, setDescripcionEditada] = useState('');
  const [errorDescripcion, setErrorDescripcion] = useState('');
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchProyectos();
  }, []);

  useEffect(() => {
    if (proyectoEnEdicion && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [descripcionEditada, proyectoEnEdicion]);

  const fetchProyectos = async (query = '', searchField = '') => {
    setCargando(true);
    setError('');
    try {
      const url = query
        ? `/api/proyectos?q=${encodeURIComponent(query)}&campo=${encodeURIComponent(searchField)}`
        : '/api/proyectos';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar proyectos');
      setResultados(await response.json());
    } catch (err) {
      setError(err.message || 'Error al cargar proyectos');
    } finally {
      setCargando(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProyectos(termino, campo);
  };

  const abrirEditorDescripcion = (proyecto) => {
    setProyectoEnEdicion(proyecto);
    setDescripcionEditada(proyecto.descripcion || proyecto.description || '');
    setErrorDescripcion('');
  };

  const cerrarEditorDescripcion = () => {
    if (guardandoDescripcion) return;
    setProyectoEnEdicion(null);
    setDescripcionEditada('');
    setErrorDescripcion('');
  };

  const handleDescripcionChange = (e) => {
    const { value } = e.target;
    setDescripcionEditada(value);

    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.max(150, e.target.scrollHeight)}px`;
    }

    if (errorDescripcion) {
      setErrorDescripcion('');
    }
  };

  const guardarDescripcion = async (e) => {
    e.preventDefault();

    if (!proyectoEnEdicion || guardandoDescripcion) return;

    const descripcionNormalizada = descripcionEditada.trim();
    if (descripcionNormalizada.length > 500) {
      setErrorDescripcion('La descripción no puede exceder 500 caracteres');
      return;
    }

    setGuardandoDescripcion(true);
    setErrorDescripcion('');

    try {
      const response = await fetch(`/api/proyectos/${proyectoEnEdicion.id}/descripcion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ descripcion: descripcionEditada }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar la descripción');
      }

      setResultados((prev) => prev.map((proyecto) => (
        proyecto.id === proyectoEnEdicion.id
          ? { ...proyecto, descripcion: data.descripcion || '' }
          : proyecto
      )));
      setProyectoEnEdicion(null);
      setDescripcionEditada('');
    } catch (err) {
      setErrorDescripcion(err.message || 'No se pudo actualizar la descripción');
    } finally {
      setGuardandoDescripcion(false);
    }
  };

  return (
    <div className="busqueda-page">
      <div className="busqueda-header">
        <h2>Búsqueda de Proyectos</h2>
        <p>Explora proyectos disponibles e inscríbete como tester</p>
      </div>

      <form onSubmit={handleSearch} className="busqueda-form">
        <select
          value={campo}
          onChange={(e) => setCampo(e.target.value)}
          className="busqueda-select"
        >
          <option value="nombre">Nombre</option>
          <option value="descripcion">Descripción</option>
        </select>
        <input
          type="text"
          placeholder={campo === 'nombre' ? 'Buscar por nombre...' : 'Buscar por descripción...'}
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          className="busqueda-input"
        />
        <button type="submit" disabled={cargando} className="busqueda-boton">
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <div className="busqueda-error">{error}</div>}
      {cargando && <p className="busqueda-cargando">Cargando proyectos...</p>}
      {!cargando && resultados.length === 0 && !error && (
        <p className="busqueda-vacio">No se encontraron proyectos.</p>
      )}

      <div className="busqueda-resultados">
        {resultados.map((proyecto) => (
          <div key={proyecto.id} className="proyecto-card">
            <h3>
              <Link to={`/resultado-consulta/${proyecto.id}`} className="proyecto-card-link">
                {proyecto.nombre}
              </Link>
            </h3>
            <p><strong>Correo:</strong> {proyecto.correo}</p>
            {(proyecto.descripcion || proyecto.description) && (
              <p className="proyecto-card-descripcion">
                <strong>Descripción:</strong> {proyecto.descripcion || proyecto.description}
              </p>
            )}
            <p className="proyecto-card-fecha">
              Subido el {new Date(proyecto.fecha_creacion).toLocaleDateString('es-ES')}
            </p>
            
            <button
              type="button"
              className="editar-descripcion-boton"
              onClick={() => abrirEditorDescripcion(proyecto)}
            >
              Modificar descripción
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Edición de Descripción */}
      {proyectoEnEdicion && (
        <div className="descripcion-modal-overlay" role="presentation" onClick={cerrarEditorDescripcion}>
          <div
            className="descripcion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="descripcion-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="descripcion-modal-header">
              <h3 id="descripcion-modal-title">Modificar descripción</h3>
              <p>{proyectoEnEdicion.nombre}</p>
            </div>

            <form onSubmit={guardarDescripcion} className="descripcion-modal-form">
              <label htmlFor="descripcion-edicion">Descripción del proyecto:</label>
              <textarea
                ref={textareaRef}
                id="descripcion-edicion"
                value={descripcionEditada}
                onChange={handleDescripcionChange}
                maxLength={500}
                placeholder="Cuéntanos un poco sobre tu proyecto..."
                className={errorDescripcion ? 'error' : ''}
              />
              {errorDescripcion && <span className="error-mensaje-descripcion">{errorDescripcion}</span>}
              <small>Máximo 500 caracteres</small>

              <div className="descripcion-modal-actions">
                <button type="button" onClick={cerrarEditorDescripcion} disabled={guardandoDescripcion} className="modal-cancelar-boton">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoDescripcion} className="modal-guardar-boton">
                  {guardandoDescripcion ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Busqueda;