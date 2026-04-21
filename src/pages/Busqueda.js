//creado en DT_10_T1
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Busqueda.css';

const Busqueda = () => {
  const { usuario } = useAuth();
  const [termino, setTermino] = useState('');  // DT_10_T1 terminos de busqueda
  const [campo, setCampo] = useState('nombre');  // DT_10_T1 tipos de busqueda
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [inscritosIds, setInscritosIds] = useState([]);
  const [proyectoEnEdicion, setProyectoEnEdicion] = useState(null);
  const [descripcionEditada, setDescripcionEditada] = useState('');
  const [errorDescripcion, setErrorDescripcion] = useState('');
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const textareaRef = useRef(null);
  //

  useEffect(() => {
    fetchProyectos();
  }, []);

  useEffect(() => {
    const inscritosLocal = JSON.parse(localStorage.getItem('mis_inscripciones') || '{}');
    const correo = usuario;

    if (!correo) {
      const todosLocales = Object.values(inscritosLocal).flat();
      setInscritosIds([...new Set(todosLocales)]);
      return;
    }

    const localIds = inscritosLocal[correo] || [];
    fetch(`/api/inscripciones/usuario?correo=${encodeURIComponent(correo)}`)
      .then(r => r.json())
      .then(data => {
        const apiIds = data.ids || [];
        setInscritosIds([...new Set([...apiIds, ...localIds])]);
      })
      .catch(() => setInscritosIds([...new Set(localIds)]));
  }, [usuario]);

  useEffect(() => {
    if (proyectoEnEdicion && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [descripcionEditada, proyectoEnEdicion]);
                    //DT_10_T1  termino         tipo
  const fetchProyectos = async (query = '', searchField = '') => {
    setCargando(true);
    setError('');
    try {
      let url = '/api/proyectos';
      if (query) {
        url = `/api/proyectos?q=${encodeURIComponent(query)}&campo=${encodeURIComponent(searchField)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar proyectos');
      const data = await response.json();
      setResultados(data);
    } catch (err) {
      setError(err.message);
      setError('Error al cargar proyectos');
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

    const getPlaceholder = () => {
    switch (campo) {
      case 'nombre':
        return 'Buscar por nombre...';
      case 'id':
        return 'Buscar por ID...';
      case 'descripcion':
        return 'Buscar por descripción...';
      default:
        return 'Buscar...';
    }
  };

  return (
    <div className="contenedor-busqueda">
      <h2>Búsqueda de Proyectos</h2>
      <form onSubmit={handleSearch} className="formula-busqueda">
        <div className="formula-grupo">
          {/* DT_5_T1 menu de seleccion*/}
          <select
            value={campo}
            onChange={(e) => setCampo(e.target.value)}
            className="busqueda-seleccionar"
          >
            <option value="nombre">Nombre</option>
            <option value="id">ID</option>
            <option value="descripcion">Descripción</option>
          </select>

          <input
            type="text"
            placeholder={getPlaceholder()}
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            className="busqueda-input"
          />
          <button type="submit" disabled={cargando} className="busqueda-boton">
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {/* DT_5_T1 infos de error*/}
      {error && <div className="error-mensaje">{error}</div>}

      {cargando && <div className="cargando">Cargando proyectos...</div>}

      {!cargando && resultados.length === 0 && (
        <p className="no-resultados">No se encontraron proyectos.</p>
      )}

      {/* DT_5_T1 mostrar la tabla del resultado*/}
      <div className="resultados-list">
        {resultados.map((proyecto) => (
          <div key={proyecto.id} className="proyecto-tabla">
            <h3>
              <Link to={`/resultado-consulta/${proyecto.id}`} className="proyecto-link">
                {proyecto.nombre}
              </Link>
            </h3>
            <p><strong>Correo:</strong> {proyecto.correo}</p>
            {(proyecto.descripcion || proyecto.description) && (
              <p className="descripcion-scroll"><strong>Descripción:</strong> {proyecto.descripcion || proyecto.description}</p>
            )}
            <p><strong>Subido:</strong> {new Date(proyecto.fecha_creacion).toLocaleDateString()}</p>
            <div className="proyecto-acciones">
              <button
                type="button"
                className="editar-descripcion-boton"
                onClick={() => abrirEditorDescripcion(proyecto)}
              >
                Modificar descripción
              </button>
              {inscritosIds.includes(proyecto.id) && proyecto.archivo_path && (
                <a
                  href={`/${proyecto.archivo_path}`}
                  download={proyecto.nombre_fichero || true}
                  className="descarga-link"
                >
                  Descargar proyecto
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

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