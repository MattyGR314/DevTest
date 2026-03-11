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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);

  // Crear FormData para enviar archivo y campos
    const data = new FormData();
    data.append('nombre', formData.nombre);
    if (formData.archivo) {
      data.append('archivo', formData.archivo);
    }

    try {
      const response = await fetch('/subircodigo', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      if (response.ok) {
        alert('Archivo subido');
        handleReset();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al subir:', error);
      alert('Error de conexión con el servidor');
    }
  
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
