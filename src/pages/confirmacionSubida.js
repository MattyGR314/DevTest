import React from 'react';
import { Link } from 'react-router-dom';
import './confirmacionSubida.css';

function ConfirmacionSubida() {
  return (
    <div className="confirmacion-wrapper">
      <div className="confirmacion-card">
        <div className="confirmacion-icono">✓</div>
        <p>Los archivos se han subido correctamente.</p>
        <Link to="/" className="confirmacion-btn">
          Volver
        </Link>
      </div>
    </div>
  );
}

export default ConfirmacionSubida;
