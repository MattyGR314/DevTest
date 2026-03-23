import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./SeleccionarProyecto.css";

function SeleccionarProyecto() {
  const { id } = useParams();
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    correo: ""
  });
  
  const [errores, setErrores] = useState({});

  useEffect(() => {
    const obtenerDatosProyecto = async () => {
      try {
        const respuesta = await fetch(`/api/proyectos/${id}`);
        if (!respuesta.ok) {
          throw new Error("No se pudo obtener el proyecto");
        }
        const datos = await respuesta.json();
        setNombreProyecto(datos.nombre);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosProyecto();
  }, [id]);

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.trim().length < 3) {
      nuevosErrores.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    
    if (!formData.correo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      nuevosErrores.correo = "El correo no es válido";
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    
    try {
      const respuesta = await fetch("/api/inscripciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim(),
          id_proyectos: parseInt(id)
        })
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        throw new Error(datos.error || "Error al guardar la inscripción");
      }

      const datos = await respuesta.json();
      setExito(true);
      // Limpiar formulario
      setFormData({ nombre: "", correo: "" });
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setExito(false), 5000);
    } catch (err) {
      setErrores({ general: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="seleccionar-proyecto">
      <h2>
        Inscripción a Proyecto: {nombreProyecto || id}
        {cargando && " (cargando...)"}
      </h2>
      
      {error && <p className="error-message">Error: {error}</p>}
      
      {exito && (
        <div className="success-message">
          ✓ ¡Inscripción guardada exitosamente!
        </div>
      )}
      
      {errores.general && (
        <div className="error-message">{errores.general}</div>
      )}

      <form id="inscripcion" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">
            Nombre <span className="required">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className={errores.nombre ? "form-control error" : "form-control"}
            maxLength="100"
            placeholder="Ingrese su nombre completo"
            disabled={enviando || cargando}
          />
          {errores.nombre && <span className="error-text">{errores.nombre}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="correo">
            Correo Electrónico <span className="required">*</span>
          </label>
          <input
            type="email"
            name="correo"
            id="correo"
            value={formData.correo}
            onChange={handleInputChange}
            className={errores.correo ? "form-control error" : "form-control"}
            placeholder="Ingrese su correo electrónico"
            disabled={enviando || cargando}
          />
          {errores.correo && <span className="error-text">{errores.correo}</span>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={enviando || cargando}
        >
          {enviando ? "Guardando..." : "Inscribirse"}
        </button>
      </form>
    </div>
  );
}

export default SeleccionarProyecto;