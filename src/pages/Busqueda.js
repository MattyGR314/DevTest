import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Busqueda.css';

const Busqueda = () => {
  const [termino, setTermino] = useState('');
  const [campo, setCampo] = useState('nombre');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProyectos();
  }, []);

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
          </div>
        ))}
      </div>

    </div>
  );
};

export default Busqueda;