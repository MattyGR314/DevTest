import React, { useState } from 'react';
import './SubirCodigo.css';

function SubirCodigo() {
  const [formData, setFormData] = useState({
    nombre: '',
    archivo: null,
    correo: '', // DT_03_1: Añadimos campo correo
  });

  const [errores, setErrores] = useState({}); // Para mostrar errores en la UI
  const [enviando, setEnviando] = useState(false); // Para evitar envíos múltiples

  // DT_03_3: Validar nombre sin caracteres especiales
  const validarNombre = (nombre) => {
    if (!nombre || nombre.trim() === '') return true; // El vacío se valida aparte
    // Solo letras, números y espacios (sin caracteres especiales)
    const regex = /^[a-zA-Z0-9\s.]+$/;
    return regex.test(nombre);
  };

  // DT_03_2: Validar formato de correo
  const validarCorreo = (correo) => {
    if (!correo || correo.trim() === '') return true; // El vacío se valida aparte
    // Formato estándar de email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  // DT_03_4: Validar que sea archivo ejecutable
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
    
    // Ajustar altura del textarea automáticamente
    if (name === 'descripcion' && e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = Math.max(150, e.target.scrollHeight) + 'px';
    }
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir envíos múltiples
    if (enviando) return;
    
    // Limpiar errores anteriores
    const nuevosErrores = {};

    // DT_03_5: Validar que ningún campo esté vacío
    if (!formData.nombre || formData.nombre.trim() === '') {
      nuevosErrores.nombre = 'El nombre del proyecto es obligatorio';
    }
    
    if (!formData.correo || formData.correo.trim() === '') {
      nuevosErrores.correo = 'El correo electrónico es obligatorio';
    }
    
    if (!formData.archivo) {
      nuevosErrores.archivo = 'Debes seleccionar un archivo';
    }

    // Si hay campos vacíos, mostrar errores y no continuar
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      // DT_03_5: Notificar al developer
      alert('Todos los campos han de estar completos');
      return;
    }

    // DT_03_3: Validar nombre sin caracteres especiales
    if (!validarNombre(formData.nombre)) {
      setErrores({ nombre: 'El nombre no puede contener caracteres especiales' });
      alert('El nombre no puede contener caracteres especiales');
      return;
    }

    // DT_03_4: Validar que sea archivo ejecutable
    if (!esEjecutable(formData.archivo)) {
      setErrores({ archivo: 'El archivo debe ser ejecutable (.exe o .bat)' });
      alert('El código subido no es un fichero ejecutable');
      return;
    }

    // DT_03_2: Validar formato de correo
    if (!validarCorreo(formData.correo)) {
      setErrores({ correo: 'El correo no sigue los estándares establecidos' });
      alert('El correo no sigue los estándares establecidos');
      return;
    }

    // DT_11_3: Validar que la descripción no exceda 500 caracteres
    const descripcionValue = document.getElementById('descripcion').value;
    if (descripcionValue && descripcionValue.length > 500) {
      setErrores({ descripcion: 'La descripción no puede exceder 500 caracteres' });
      alert('La descripción no puede exceder 500 caracteres');
      return;
    }

    // Si llegamos aquí, todas las validaciones pasaron
    setEnviando(true);
    console.log('Formulario enviado:', formData);

    // Crear FormData para enviar archivo y campos
    const data = new FormData();
    data.append('nombre', formData.nombre.trim());
    data.append('correo', formData.correo.trim());
    data.append('descripcion', formData.descripcion ? formData.descripcion.trim() : '');
    if (formData.archivo) {
      data.append('archivo', formData.archivo);
    }

    try {
      const response = await fetch('/subircodigo', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      // DT_03_6: Verificar si el nombre ya existe (código 409 Conflict)
      if (response.status === 409) {
        setErrores({ nombre: 'Ya existe un proyecto con este nombre' });
        alert('Ya existe un proyecto con este nombre');
        setEnviando(false);
        return;
      }

      if (response.ok) {
        // DT_03_2: Proyecto registrado con éxito
        alert('Archivo subido correctamente');
        handleReset();
      } else {
        alert(`Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al subir:', error);
      alert('Error de conexión con el servidor');
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

  const descripcionError = errores.descripcion;
  const descripcionValue = formData.descripcion || '';
  const descripcionClassName = descripcionError ? 'error' : '';

  return (
    <div className="subir-codigo">
      <form id="uploadCode" onSubmit={handleSubmit} noValidate>
        {/* Campo: Nombre del proyecto */}
        <div className="form-group">
          <label htmlFor="nombre">
            Escriba el nombre de su proyecto: <span className="required">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
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

        {/* DT_03_1: Nuevo campo: Correo electrónico */}
        <div className="form-group">
          <label htmlFor="correo">
            Correo electrónico: <span className="required">*</span>
          </label>
          <input
            type="email"
            name="correo"
            id="correo"
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

        {/* Campo: Archivo ejecutable */}
        <div className="form-group">
          <label htmlFor="archivo">
            Selecciona un archivo ejecutable: <span className="required">*</span>
          </label>
          <input
            type="file"
            name="archivo"
            id="archivo"
            accept=".exe, .bat"
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
        <div className="form-group">
          <label htmlFor="descripcion">Descripción del proyecto:</label>
          <textarea
            name="descripcion"
            id="descripcion"
            placeholder="Cuéntanos un poco sobre tu proyecto..."
            value={descripcionValue}
            onChange={handleInputChange}
            maxLength={500}
            className={descripcionClassName}
          />
          {descripcionError && (
            <span className="error-message" role="alert">
              ⚠️ {descripcionError}
            </span>
          )}
          <small>Máximo 500 caracteres</small>
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

        {/* Indicador de campos obligatorios */}
        <div className="required-note">
          <span className="required">*</span> Campos obligatorios
        </div>
      </form>
    </div>
  );
}

export default SubirCodigo;
