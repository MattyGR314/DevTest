//creado en DT_10_T1
import React, { useState, useEffect } from 'react';
import './Busqueda.css';

const Busqueda = () => {
  const [termino, setTermino] = useState('');  // DT_10_T1 terminos de busqueda
  const [campo, setCampo] = useState('nombre');  // DT_10_T1 tipos de busqueda
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProyectos();
  }, []);
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
    <div className="contenedaor-busqueda">
      <h2>Búsqueda de Proyectos</h2>
      <form onSubmit={handleSearch} className="formula-busqueda">
        <div className="formula-grupo">
          {/* DT_10_T1 menu de seleccion*/}
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

      {!cargando && resultados.length === 0 && termino && (
        <p className="no-resultados">No se encontraron proyectos.</p>
      )}

      {/* DT_10_T1 mostrar la tabla del resultado*/}
      <div className="resultados-list">
        {resultados.map((proyecto) => (
          <div key={proyecto.id} className="proyecto-tabla">
            <h3>{proyecto.nombre}</h3>
            <p><strong>Correo:</strong> {proyecto.correo}</p>
            {proyecto.description && <p><strong>Descripción:</strong> {proyecto.description}</p>}
            <p><strong>Subido:</strong> {new Date(proyecto.fecha_creacion).toLocaleDateString()}</p>
            {proyecto.archivo_path && (
              <a href={`/uploads/${proyecto.archivo_path.split('/').pop()}`} download>
                Descargar archivo
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Busqueda;