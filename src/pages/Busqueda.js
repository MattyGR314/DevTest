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

      {cargando && <div className="cargando">Cargando proyectos...</div>}

      {!cargando && resultados.length === 0 && (
        <p className="no-resultados">No se encontraron proyectos.</p>
      )}

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
              <p><strong>Descripción:</strong> {proyecto.descripcion || proyecto.description}</p>
            )}
            <p><strong>Subido:</strong> {new Date(proyecto.fecha_creacion).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Busqueda;