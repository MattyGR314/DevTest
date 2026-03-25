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

      {error && <div className="error-mensaje">{error}</div>}

      {cargando && <div className="cargando">Cargando proyectos...</div>}

      {!cargando && resultados.length === 0 && termino && (
        <p className="no-resultados">No se encontraron proyectos.</p>
      )}

    </div>
  );
};

export default Busqueda;
