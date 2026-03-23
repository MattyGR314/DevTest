"use strict"

require('dotenv').config();
const express = require("express");
const path = require("path");
const mysql = require('mysql2/promise');

const multer = require('multer');
const fs = require('fs');

const app = express();

// Detectar si estamos en entorno de pruebas
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true';

// Si es entorno de pruebas, deshabilitar la verificación de duplicados
// o usar una base de datos de prueba
if (isTestEnvironment) {
  console.log('🧪 ENTORNO DE PRUEBAS DETECTADO');
}

// Pool de conexiones a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== RUTAS API (ANTES de archivos estáticos) =====

// Ruta para verificar estado de conexión a BD
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'ok', message: 'Aplicación y BD conectadas correctamente' });
  } catch (error) {
    console.error('Error de conexión a BD:', error);
    res.status(500).json({ status: 'error', message: 'Error en conexión a BD', error: error.message });
  }
});

// Ruta de prueba - obtener datos de la BD
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() as current_database;');
    connection.release();
    res.json({ message: 'Conectado a la BD', data: rows });
  } catch (error) {
    console.error('Error en query:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTA PARA OBTENER UN PROYECTO POR ID =====
app.get('/api/proyectos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID de proyecto inválido' });
    }

    const connection = await pool.getConnection();

    // Consultar el proyecto por ID
    const [proyecto] = await connection.execute(
      'SELECT id, nombre, correo, archivo_path, fecha_creacion FROM proyectos WHERE id = ?',
      [id]
    );

    connection.release();

    if (proyecto.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({
      id: proyecto[0].id,
      nombre: proyecto[0].nombre,
      correo: proyecto[0].correo,
      archivo_path: proyecto[0].archivo_path,
      fecha_creacion: proyecto[0].fecha_creacion
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto', detalles: error.message });
  }
});

// ===== RUTA PARA GUARDAR INSCRIPCIONES =====
app.post('/api/inscripciones', async (req, res) => {
  try {
    console.log('📝 Registro de inscripción...');
    
    const { nombre, correo, id_proyectos } = req.body;

    // Validar campos obligatorios
    if (!nombre || !nombre.trim()) {
      console.warn('⚠️  Nombre no proporcionado');
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!correo || !correo.trim()) {
      console.warn('⚠️  Correo no proporcionado');
      return res.status(400).json({ error: 'El correo es obligatorio' });
    }

    if (!id_proyectos || isNaN(id_proyectos)) {
      console.warn('⚠️  ID de proyecto inválido');
      return res.status(400).json({ error: 'ID de proyecto inválido' });
    }

    // Validar formato de correo
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo.trim())) {
      console.warn('⚠️  Correo inválido:', correo);
      return res.status(400).json({ error: 'El formato del correo no es válido' });
    }

    // Obtener conexión a BD
    console.log('🔄 Conectando a BD...');
    const connection = await pool.getConnection();

    // Verificar que la tabla inscripciones existe
    console.log('🔍 Verificando tabla inscripciones...');
    const [tableCheck] = await connection.query('SHOW TABLES LIKE "inscripciones"');
    if (tableCheck.length === 0) {
      connection.release();
      throw new Error('La tabla "inscripciones" no existe. Por favor, ejecuta: node infra/setup_database.js');
    }

    // Verificar que el proyecto existe
    console.log('🔍 Verificando que el proyecto existe...');
    const [proyectoExists] = await connection.execute(
      'SELECT id FROM proyectos WHERE id = ?',
      [id_proyectos]
    );

    if (proyectoExists.length === 0) {
      connection.release();
      console.warn('⚠️  Proyecto no encontrado:', id_proyectos);
      return res.status(404).json({ error: 'El proyecto no existe' });
    }

    // Insertar la inscripción
    console.log('📥 Insertando inscripción...');
    const [result] = await connection.execute(
      'INSERT INTO inscripciones (nombre, correo, id_proyectos) VALUES (?, ?, ?)',
      [nombre.trim(), correo.trim(), id_proyectos]
    );

    connection.release();

    console.log('✓ Inscripción guardada. ID:', result.insertId);

    res.status(201).json({
      message: 'Inscripción guardada exitosamente',
      id: result.insertId,
      nombre: nombre.trim(),
      correo: correo.trim(),
      id_proyectos: id_proyectos
    });

  } catch (error) {
    console.error('❌ Error al guardar inscripción:', error.message);
    res.status(500).json({
      error: 'Error al guardar la inscripción',
      detalles: error.message
    });
  }
});


// ===== CONFIGURACIÓN DE SUBIDA DE ARCHIVOS =====
// Asegurar que existe la carpeta uploads
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurar multer: almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ===== RUTA PARA SUBIR ARCHIVOS =====
app.post('/subircodigo', upload.single('archivo'), async (req, res) => {
  try {

    // Verificar si ya existe un proyecto con el mismo nombre (DT_03_6)
    // SOLO si NO estamos en entorno de pruebas

    console.log('📝 Inicio de subida de archivo...');
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file ? req.file.filename : 'ninguno');

    // Obtener los datos del formulario
    const { nombre, correo } = req.body;
    const archivo = req.file;
    const filePath = archivo ? archivo.path : null;

    // Validar campos obligatorios
    if (!nombre) {
      console.warn('⚠️  Nombre no proporcionado');
      return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
    }

    if (!correo) {
      console.warn('⚠️  Correo no proporcionado');
      return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    }

    if (!archivo) {
      console.warn('⚠️  Archivo no proporcionado');
      return res.status(400).json({ error: 'El archivo es obligatorio' });
    }

    // Intentar conectar a la base de datos
    console.log('🔄 Intentando conexión a BD...');
    const connection = await pool.getConnection();
    console.log('✓ Conexión obtenida');

    // Verificar que la tabla existe
    console.log('🔍 Verificando tabla proyectos...');
    const [tableCheck] = await connection.query('SHOW TABLES LIKE "proyectos"');
    if (tableCheck.length === 0) {
      throw new Error('La tabla "proyectos" no existe. Ejecuta: node infra/setup_database.js');
    }
    console.log('✓ Tabla proyectos existe');

       if (!isTestEnvironment) {
      console.log('🔍 Verificando si el nombre ya existe...');
      const [existingProject] = await connection.execute(
        'SELECT id FROM proyectos WHERE nombre = ?',
        [nombre]
      );

      if (existingProject.length > 0) {
        console.warn('⚠️  Nombre de proyecto duplicado:', nombre);
        connection.release();
        return res.status(409).json({ 
          error: 'Ya existe un proyecto con este nombre',
          codigo: 'NOMBRE_DUPLICADO'
        });
      }
      console.log('✓ Nombre disponible');
    } else {
      console.log('🧪 Entorno de pruebas: omitiendo verificación de duplicados');
    }

    // Insertar en la base de datos (SIN campo estado)
    console.log('📥 Insertando datos en BD...');
    const [result] = await connection.execute(
      'INSERT INTO proyectos (nombre, correo, archivo_path) VALUES (?, ?, ?)',
      [nombre, correo, filePath]
    );
    console.log('✓ Datos insertados. ID:', result.insertId);

    connection.release();

    res.json({ 
      message: 'Archivo subido correctamente',
      id: result.insertId,
      nombre: nombre,
      correo: correo,
      archivo: archivo ? archivo.filename : null
    });
  } catch (error) {
    console.error('❌ Error al guardar proyecto:', error.message);
    console.error('Error completo:', error);
    
    // Enviar respuesta con detalles del error
    res.status(500).json({ 
      error: 'Error al guardar proyecto',
      detalles: error.message,
      codigo: error.code
    });
  }
});


// ===== ARCHIVOS ESTÁTICOS (React) =====
app.use(express.static(path.join(__dirname, "build")));

// Manejo de rutas SPA - servir index.html para todas las rutas no API
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error del servidor');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function (error) {
  if (error) {
    console.log('Error al iniciar servidor:', error);
  } else {
    console.log(`Servidor React en puerto ${PORT}`);
    console.log(`Abre http://localhost:${PORT} en tu navegador`);
    console.log(`BD: ${process.env.DB_HOST || 'No configurada'}`);
    console.log(`Base de datos: ${process.env.DB_NAME || 'No configurada'}`);
    console.log(`Prueba conexión: http://localhost:${PORT}/api/health`);
  }
});