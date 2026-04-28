import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './SubirCodigo.css';

const INITIAL_STATE = {
  nombre: '',
  archivo: null,
  correo: '',
  descripcion: '',
  fechaLimite: '',
  numeroTesters: '',
};

function SubirCodigo() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ ...INITIAL_STATE, correo: usuario || '' });

  useEffect(() => {
    if (usuario) {
      setFormData(prev => ({ ...prev, correo: usuario }));
    }
  }, [usuario]);
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

  const validarFechaLimite = (fechaLimite) => {
    if (!fechaLimite) return true;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSeleccionada = new Date(`${fechaLimite}T00:00:00`);
    return fechaSeleccionada > hoy;
  };

  const validarNumeroTesters = (numeroTesters) => {
    if (numeroTesters === '' || numeroTesters === null || numeroTesters === undefined) return true;
    const valor = String(numeroTesters).trim();
    if (!/^\d+$/.test(valor)) return false;
    const numero = Number.parseInt(valor, 10);
    return numero > 0;
  };

  const fechaMinimaLimite = (() => {
    const manana = new Date();
    manana.setHours(0, 0, 0, 0);
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().split('T')[0];
  })();

  const esEjecutable = (archivo) => {
    if (!archivo) return false;
    const extension = archivo.name.split('.').pop().toLowerCase();
    return extension === 'exe' || extension === 'bat';
  };

  //Nueva función limpiarError
  const limpiarError = (campo) => {
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: '' }));
    }
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
    limpiarError(name);

    if (mensaje) setMensaje('');
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData(prev => ({
      ...prev,
      archivo: files[0],
    }));

    limpiarError('archivo');

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

    // Si no hay archivo en el state, intentar leer directamente del input (puede pasar si el usuario clicó muy rápido)
    const archivoDesdeInput = fileInputRef.current?.files?.[0];
    const archivoAUsar = formData.archivo || archivoDesdeInput;

    if (!archivoAUsar) {
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

    if (!esEjecutable(archivoAUsar)) {
      setErrores({ archivo: 'El archivo debe ser ejecutable (.exe o .bat)' });
      return;
    }

    if (!validarCorreo(formData.correo)) {
      setErrores({ correo: 'El correo no sigue los estándares establecidos' });
      return;
    }

    if (!validarFechaLimite(formData.fechaLimite)) {
      setErrores({ fechaLimite: 'La fecha límite debe ser posterior a la fecha actual' });
      return;
    }

    const valorNumeroTesters = String(formData.numeroTesters ?? '').trim();
    if (valorNumeroTesters !== '') {
      const numeroTesters = Number(valorNumeroTesters);
      if (!Number.isNaN(numeroTesters) && numeroTesters < 0) {
        setErrores({ numeroTesters: 'El número de testers no puede ser un número negativo' });
        return;
      }
    }

    if (!validarNumeroTesters(formData.numeroTesters)) {
      setErrores({ numeroTesters: 'El número de testers debe ser un entero positivo mayor que 0' });
      return;
    }

    const descripcionValue = formData.descripcion || '';
    if (descripcionValue && descripcionValue.length > 500) {
      setErrores({ descripcion: 'La descripción no puede exceder 500 caracteres' });
      return;
    }
    setEnviando(true);
    console.log('Formulario enviado:', { ...formData, archivo: archivoAUsar });


    const data = new FormData();
    data.append('nombre', formData.nombre.trim());
    data.append('correo', formData.correo.trim());
    data.append('descripcion', formData.descripcion ? formData.descripcion.trim() : '');
    data.append('fecha_limite', formData.fechaLimite || '');
    data.append('num_testers', formData.numeroTesters || '');
    if (formData.archivo) {
      data.append('archivo', formData.archivo);
    }

    try {
      const response = await fetch('/subircodigo', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      const errorMsg = result.error || result.message || 'Inténtalo de nuevo';

      if (response.status === 409) {
        // Error de duplicidad en la base de datos
        setErrores({ nombre: errorMsg || 'Ya existe un proyecto con este nombre' });
        setMensaje(errorMsg || 'Ya existe un proyecto con este nombre');
        setEnviando(false);
        return;
      }

      if (response.status === 400) {
        // Error de validación en el servidor (ej: campo inválido)
        setMensaje(errorMsg);
        setEnviando(false);
        return;
      }

      if (response.status === 500) {
        // Error interno del servidor
        setMensaje(errorMsg);
        setEnviando(false);
        return;
      }

      if (response.status === 503) {
        // Base de datos no disponible
        setMensaje(errorMsg);
        setEnviando(false);
        return;
      }

      if (response.ok) {
        setMensaje('Archivo subido correctamente');
        handleReset();
        navigate('/confirmacion');
      } else {
        setMensaje(`Error desconocido: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      setMensaje('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_STATE);
    setErrores({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const descripcionError = errores.descripcion;
  const descripcionClassName = descripcionError ? 'error' : '';
  const mostrarMensajeGlobal = mensaje && Object.keys(errores).length === 0;

  return (
    <>
    <div className="subir-codigo-header">
      <h2>Sube tu proyecto</h2>
      <p>Comparte tu ejecutable y recibe feedback de la comunidad de testers</p>
    </div>

    <div className="subir-codigo">

      {mostrarMensajeGlobal && (
        <div className="mensaje-global mensaje-separado" role="alert" aria-live="polite">
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
              {errores.nombre}
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
              {errores.correo}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="archivo">
            Selecciona un archivo ejecutable: <span className="required">*</span>
          </label>
          <input
            ref={fileInputRef}
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
              {errores.archivo}
            </span>
          )}
          {formData.archivo && (
            <small className="file-info">
              Archivo seleccionado: {formData.archivo.name}
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
            value={formData.descripcion}
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

        <div className="form-group">
          <label htmlFor="fechaLimite">Fecha límite:</label>
          <input
            type="date"
            name="fechaLimite"
            id="fechaLimite"
            min={fechaMinimaLimite}
            value={formData.fechaLimite}
            onChange={handleInputChange}
            className={errores.fechaLimite ? 'error' : ''}
          />
          {errores.fechaLimite && (
            <span className="error-message" role="alert">
              {errores.fechaLimite}
            </span>
          )}
          <small>Debe ser posterior a la fecha actual</small>
        </div>

        <div className="form-group">
          <label htmlFor="numeroTesters">Número de testers:</label>
          <input
            type="number"
            name="numeroTesters"
            id="numeroTesters"
            placeholder="Ej: 10"
            min="1"
            step="1"
            value={formData.numeroTesters}
            onChange={handleInputChange}
            className={errores.numeroTesters ? 'error' : ''}
          />
          {errores.numeroTesters && (
            <span className="error-message" role="alert">
              {errores.numeroTesters}
            </span>
          )}
          <small>Solo enteros positivos mayores que 0</small>
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
    </>
  );
}

export default SubirCodigo;
