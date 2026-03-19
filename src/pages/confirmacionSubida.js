import React from 'react';
import { Link } from 'react-router-dom';
import './confirmacionSubida.css';

function ConfirmacionSubida() {
  return (
    <div className="confirmacionSubida">
      <p>Los archivos se han subido correctamente.</p>
      <Link to="/" className="btn btn-primary">
        Volver
      </Link>
    </div>
  );
}

export default ConfirmacionSubida;