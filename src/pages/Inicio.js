import { Link } from 'react-router-dom';
import './Inicio.css';

const features = [
  {
    icon: '⬆',
    titulo: 'Sube tu proyecto',
    descripcion: 'Comparte tu código con la comunidad y recibe feedback real de testers.',
  },
  {
    icon: '🔍',
    titulo: 'Explora y prueba',
    descripcion: 'Descubre proyectos, detecta errores y ayuda a otros desarrolladores a mejorar.',
  },
  {
    icon: '⭐',
    titulo: 'Gana puntos',
    descripcion: 'Cada contribución suma. Acumula puntos y canjéalos por recompensas.',
  },
];

function Inicio() {
  return (
    <div className="inicio">

      <section className="hero">
        <h1 className="hero-titulo">
          Donde el código <span className="hero-acento">mejora</span>
        </h1>
        <p className="hero-subtitulo">
          La plataforma que conecta desarrolladores y testers para crear proyectos mejores, juntos.
        </p>
        <div className="hero-acciones">
          <Link to="/subircodigo" className="btn-inicio-primario">Subir proyecto</Link>
          <Link to="/busqueda" className="btn-inicio-secundario">Explorar proyectos</Link>
        </div>
      </section>

      <section className="features">
        {features.map((f) => (
          <div key={f.titulo} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-titulo">{f.titulo}</h3>
            <p className="feature-descripcion">{f.descripcion}</p>
          </div>
        ))}
      </section>

    </div>
  );
}

export default Inicio;
