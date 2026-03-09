import React, { useState } from 'react';
import './SubirCodigo.css';

function SubirCodigo() {
  const [formData, setFormData] = useState({
    nombre: '',
    archivo: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData(prev => ({
      ...prev,
      archivo: files[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    // Aquí puedes enviar los datos al servidor
  };

  const handleReset = () => {
    setFormData({
      nombre: '',
      archivo: null,
    });
  };

  return (
    <div className="subir-codigo">
      <form id="uploadCode" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Escriba el nombre de su proyecto:</label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="archivo">Selecciona un archivo:</label>
          <input
            type="file"
            name="archivo"
            id="archivo"
            accept=".exe, .bat"
            onChange={handleFileChange}
          />
        </div>

        <div className="form-buttons">
          <button type="submit">Aceptar</button>
          <button type="reset" onClick={handleReset}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default SubirCodigo;
