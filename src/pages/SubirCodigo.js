import React, { useState } from 'react';
import './SubirCodigo.css';

function SubirCodigo() {
  const [formData, setFormData] = useState({
    nombre: '',
    archivo: null,
    correo: '',
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  const validarNombre = (nombre) => {
    if (!nombre || nombre.trim() === '') return true;
    const regex = /^[a-zA-Z0-9\s.]+$/;
    return regex.test(nombre);
  };

  const validarCorreo = (correo) => {
    if (!correo || correo.trim() === '') return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const esEjecutable = (archivo) => {
    if (!archivo) return false;
    const extension = archivo.name.split('.').pop().toLowerCase();
    return extension === 'exe' || extension === 'bat';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }

    if (mensaje) setMensaje('');
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData(prev => ({
      ...prev,
      archivo: files[0],
    }));

    if (errores.archivo) {
      setErrores(prev => ({ ...prev, archivo: '' }));
    }
    if (mensaje) setMensaje('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (enviando) return;
    
    const nuevosErrores = {};
    setMensaje('');

    if (!formData.nombre || formData.nombre.trim() === '') {
      nuevosErrores.nombre = 'El nombre del proyecto es obligatorio';
    }
    
    if (!formData.correo || formData.correo.trim() === '') {
      nuevosErrores.correo = 'El correo electrónico es obligatorio';
    }
    
    if (!formData.archivo) {
      nuevosErrores.archivo = 'Debes seleccionar un archivo';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setMensaje('Todos los campos deben estar completos');
      return;
    }

    if (!validarNombre(formData.nombre)) {
      setErrores({ nombre: 'El nombre no puede contener caracteres especiales' });
      return;
    }

    if (!esEjecutable(formData.archivo)) {
      setErrores({ archivo: 'El archivo debe ser ejecutable (.exe o .bat)' });
      return;
    }

    if (!validarCorreo(formData.correo)) {
      setErrores({ correo: 'El correo no sigue los estándares establecidos' });
      return;
    }

    setEnviando(true);
    console.log('Formulario enviado:', formData);

    const data = new FormData();
    data.append('nombre', formData.nombre.trim());
    data.append('correo', formData.correo.trim());
    if (formData.archivo) {
      data.append('archivo', formData.archivo);
    }

    try {
      const response = await fetch('/subircodigo', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (response.status === 409) {
        setErrores({ nombre: 'Ya existe un proyecto con este nombre' });
        setEnviando(false);
        return;
      }

      if (response.ok) {
        setMensaje('Archivo subido correctamente');
        handleReset();
      } else {
        setMensaje('Error al subir el archivo');
      }
    } catch (error) {
      console.error('Error al subir el archivo:', error);
    } finally {
      setEnviando(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nombre: '',
      archivo: null,
      correo: '',
    });
    setErrores({});
  };

  return (
    <div className="subir-codigo">

      {mensaje && (
        <div className="mensaje-global mensaje-separado">
          {mensaje}
        </div>
      )}

      <form id="uploadCode" onSubmit={handleSubmit} noValidate>

        <div className="form-group">
          <label htmlFor="nombre">
            Escriba el nombre de su proyecto: <span className="required">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            inputMode="text"
            placeholder="Ej: Mi Juego Increíble"
            value={formData.nombre}
            onChange={handleInputChange}
            className={errores.nombre ? 'error' : ''}
            maxLength="100"
          />
          {errores.nombre && (
            <span className="error-message" role="alert">
              ⚠️ {errores.nombre}
            </span>
          )}
          <small>Solo letras, números y espacios (sin caracteres especiales)</small>
        </div>

        <div className="form-group">
          <label htmlFor="correo">
            Correo electrónico: <span className="required">*</span>
          </label>
          <input
            type="text"
            name="correo"
            id="correo"
            inputMode="text"
            placeholder="tu@email.com"
            value={formData.correo}
            onChange={handleInputChange}
            className={errores.correo ? 'error' : ''}
          />
          {errores.correo && (
            <span className="error-message" role="alert">
              ⚠️ {errores.correo}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="archivo">
            Selecciona un archivo ejecutable: <span className="required">*</span>
          </label>
          <input
            type="file"
            name="archivo"
            id="archivo"
            accept=".exe, .bat"
            inputMode="none"
            onChange={handleFileChange}
            className={errores.archivo ? 'error' : ''}
          />
          {errores.archivo && (
            <span className="error-message" role="alert">
              ⚠️ {errores.archivo}
            </span>
          )}
          {formData.archivo && (
            <small className="file-info">
              📁 Archivo seleccionado: {formData.archivo.name} 
              ({(formData.archivo.size / 1024).toFixed(2)} KB)
            </small>
          )}
          <small>Formatos permitidos: .exe, .bat</small>
        </div>

        <div className="form-buttons">
          <button 
            type="submit" 
            disabled={enviando}
            className={enviando ? 'enviando' : ''}
          >
            {enviando ? 'Enviando...' : 'Aceptar'}
          </button>
          <button type="button" onClick={handleReset} disabled={enviando}>
            Cancelar
          </button>
        </div>

        <div className="required-note">
          <span className="required">*</span> Campos obligatorios
        </div>
      </form>
    </div>
  );
}

export default SubirCodigo;
