//creado en DT_10_T1
import React, { useState, useEffect } from 'react';
//para el boton de consultar detalles
import { useNavigate } from 'react-router-dom';
//
import './Busqueda.css';

const Busqueda = () => {
  //para el boton de consultar detalles
  const navigate = useNavigate();
  //
  const [termino, setTermino] = useState('');  // DT_10_T1 terminos de busqueda
  const [campo, setCampo] = useState('nombre');  // DT_10_T1 tipos de busqueda
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  //para el boton de consultar detalles
  const [detalleProyectoId, setDetalleProyectoId] = useState(null);
  //

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
      
      //para el boton de consultar detalles
      const queryLimpia = query.trim();
      if (searchField === 'nombre' && queryLimpia !== '' && data.length > 0) {
        const exacto = data.find((proyecto) =>
          (proyecto.nombre || '').toLowerCase() === queryLimpia.toLowerCase()
        );
        const proyectoDestino = exacto || data[0];
        setDetalleProyectoId(proyectoDestino.id);
      } else {
        setDetalleProyectoId(null);
      }
      //
    } catch (err) {
      setError(err.message);
      //para el boton de consultar detalles
      setDetalleProyectoId(null);
      //
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

          <button
            type="button" //para el boton de consultar detalles
            className="detalle-directo-boton"   
            disabled={cargando || !detalleProyectoId}
            onClick={() => navigate(`/resultado-consulta/${detalleProyectoId}`)}
          >
            Ver detalles
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
            <h3>{proyecto.nombre}</h3>
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
