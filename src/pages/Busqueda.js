//creado en DT_10_T1
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Busqueda.css';

const Busqueda = () => {
  const [termino, setTermino] = useState('');  // DT_10_T1 terminos de busqueda
  const [campo, setCampo] = useState('nombre');  // DT_10_T1 tipos de busqueda
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [proyectoEnEdicion, setProyectoEnEdicion] = useState(null);
  const [descripcionEditada, setDescripcionEditada] = useState('');
  const [errorDescripcion, setErrorDescripcion] = useState('');
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const textareaRef = useRef(null);
  //

  useEffect(() => {
    fetchProyectos();
  }, []);

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

  const getPlaceholder = () => {
    switch (campo) {
      case 'nombre': return 'Buscar por nombre...';
      case 'id': return 'Buscar por ID...';
      case 'descripcion': return 'Buscar por descripción...';
      default: return 'Buscar...';
    }
  };

  return (
    <div className="contenedor-busqueda">

      <div className="busqueda-cabecera">
        <h2>Búsqueda de Proyectos</h2>
        <p className="busqueda-subtitulo">Encuentra proyectos por nombre, ID o descripción</p>
      </div>

      <form onSubmit={handleSearch} className="formula-busqueda">
        <div className="formula-grupo">
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

      {error && <div className="error-mensaje">{error}</div>}

      {cargando && (
        <div className="cargando">
          <div className="cargando-spinner"></div>
          Cargando proyectos...
        </div>
      )}

      {!cargando && resultados.length === 0 && !error && (
        <div className="no-resultados">
          <p>No se encontraron proyectos.</p>
        </div>
      )}

      {!cargando && resultados.length > 0 && (
        <p className="resultados-contador">
          {resultados.length} proyecto{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="resultados-list">
        {resultados.map((proyecto) => (
          <div key={proyecto.id} className="proyecto-card">
            <div className="proyecto-card-info">
              <div className="proyecto-card-id">#{proyecto.id}</div>
              <h3 className="proyecto-card-nombre">{proyecto.nombre}</h3>
              <p className="proyecto-card-dato">
                <span className="proyecto-card-etiqueta">Correo:</span> {proyecto.correo}
              </p>
              {(proyecto.descripcion || proyecto.description) && (
                <p className="proyecto-card-dato proyecto-card-descripcion">
                  <span className="proyecto-card-etiqueta">Descripción:</span>{' '}
                  {proyecto.descripcion || proyecto.description}
                </p>
              )}
              <p className="proyecto-card-dato proyecto-card-fecha">
                Subido el {new Date(proyecto.fecha_creacion).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div className="proyecto-card-acciones">
              <button
                className="consulta-boton"
                onClick={() => navigate(`/resultado-consulta/${proyecto.id}`)}
              >
                Ver consulta
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Busqueda;