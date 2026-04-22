"use strict"

require('dotenv').config();
const express = require("express");
const path = require("path");
const mysql = require('mysql2/promise');

const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const { 
  notFoundHandler,
  multerErrorHandler,
  validationErrorHandler,
  authErrorHandler,
  dbErrorHandler, 
  genericErrorHandler 
} = require("./middleware/errorHandler");


// Detectar si estamos en entorno de pruebas
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true';

if (isTestEnvironment) {
  console.log('🧪 ENTORNO DE PRUEBAS DETECTADO');
}

// ===== CONFIGURACIÓN DE RATE LIMIT (ERROR 429) =====
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas peticiones desde esta IP. Por favor, intenta de nuevo en 15 minutos.',
    code: 'TOO_MANY_REQUESTS'
  },
  skip: (req, res) => isTestEnvironment
});

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100, 
  message: {
    status: 'error',
    message: 'Has excedido el límite de peticiones a la API.',
    code: 'TOO_MANY_REQUESTS'
  },
  skip: (req, res) => isTestEnvironment
});

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

// ===== RUTAS API =====

app.use('/api', apiLimiter); 

// Health Check
app.get('/api/health', async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'ok', message: 'Aplicación y BD conectadas correctamente' });
  } catch (error) {
    console.error('Error de conexión a BD:', error);
    next(error);
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT correo, password_hash, tipo FROM usuarios WHERE correo = ?',
      [correo]
    );
    connection.release();

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no registrado' });
    if (rows[0].password_hash !== contrasena) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.json({ correo: rows[0].correo, tipo: rows[0].tipo });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Registro (Incluye lógica DT 01 05 para tipo de cuenta)
app.post('/api/registro', async (req, res) => {
  const { correo, contrasena, tipoCuenta } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const connection = await pool.getConnection();
    const [existing] = await connection.execute('SELECT id FROM usuarios WHERE correo = ?', [correo]);

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    await connection.execute(
      'INSERT INTO usuarios (correo, password_hash, tipo) VALUES (?, ?, ?)',
      [correo, contrasena, tipoCuenta || 'developer']
    );
    connection.release();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Listado y Búsqueda (Lógica DT_10_T1 avanzada)
app.get('/api/proyectos', async (req, res) => {
  try {
    const termino = req.query.q;
    const campo = req.query.campo;
    const connection = await pool.getConnection();

    let query = '';
    let params = [];

    if (termino && termino.trim() !== '') {
      switch (campo) {
        case 'id':
          const idBuscado = parseInt(termino, 10);
          if (isNaN(idBuscado)) {
            query = 'SELECT * FROM proyectos WHERE 1 = 0';
          } else {
            query = 'SELECT * FROM proyectos WHERE id = ?';
            params = [idBuscado];
          }
          break;
        case 'descripcion':
          query = 'SELECT * FROM proyectos WHERE descripcion LIKE ?';
          params = [`%${termino}%`];
          break;
        default:
          query = 'SELECT * FROM proyectos WHERE nombre LIKE ?';
          params = [`%${termino}%`];
      }
    } else {
      query = 'SELECT * FROM proyectos ORDER BY fecha_creacion DESC';
    }

    const [rows] = await connection.query(query, params);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos', detalles: error.message });
  }
});

// Obtener proyecto por ID
app.get('/api/proyectos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'ID de proyecto inválido' });

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, nombre, correo, archivo_path, nombre_fichero, descripcion, fecha_creacion FROM proyectos WHERE id = ?',
      [id]
    );
    connection.release();

    if (rows.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

// Actualizar descripción de proyecto
app.put('/api/proyectos/:id/descripcion', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';

  if (isNaN(id)) return res.status(400).json({ error: 'ID no válido' });
  if (descripcion.length > 500) return res.status(400).json({ error: 'La descripción es demasiado larga' });

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE proyectos SET descripcion = ? WHERE id = ?',
      [descripcion || null, id]
    );
    connection.release();

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ message: 'Descripción actualizada correctamente', id, descripcion });
  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Inscripciones
app.post('/api/inscripciones', async (req, res) => {
  const { nombre, correo, id_proyectos } = req.body;
  if (!nombre || !correo || isNaN(id_proyectos)) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const connection = await pool.getConnection();
    
    // Verificar si el proyecto y usuario existen
    const [proyecto] = await connection.execute('SELECT id FROM proyectos WHERE id = ?', [id_proyectos]);
    const [usuario] = await connection.execute('SELECT id FROM usuarios WHERE correo = ?', [correo.trim()]);

    if (proyecto.length === 0 || usuario.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Proyecto o usuario no encontrado' });
    }

    const [result] = await connection.execute(
      'INSERT INTO inscripciones (nombre, correo, id_proyectos) VALUES (?, ?, ?)',
      [nombre.trim(), correo.trim(), id_proyectos]
    );
    connection.release();
    res.status(201).json({ message: 'Inscripción realizada', id: result.insertId });
  } catch (error) {
    console.error('Error en inscripción:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Comprobar inscripción
app.get('/api/inscripciones/check', async (req, res) => {
  const { correo, id_proyectos } = req.query;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id FROM inscripciones WHERE correo = ? AND id_proyectos = ?',
      [correo.trim(), parseInt(id_proyectos)]
    );
    connection.release();
    res.json({ inscrito: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Error al comprobar inscripción' });
  }
});

// ===== SUBIDA DE ARCHIVOS =====
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/subircodigo', uploadLimiter, upload.single('archivo'), async (req, res, next) => {
  try {
    const { nombre, correo, descripcion } = req.body;
    const archivo = req.file;

    if (!nombre || !correo || !archivo) return res.status(400).json({ error: 'Faltan campos obligatorios' });

    const connection = await pool.getConnection();

    if (!isTestEnvironment) {
      const [existing] = await connection.execute('SELECT id FROM proyectos WHERE nombre = ?', [nombre]);
      if (existing.length > 0) {
        connection.release();
        return res.status(409).json({ error: 'Nombre duplicado', codigo: 'NOMBRE_DUPLICADO' });
      }
    }

    const [result] = await connection.execute(
      'INSERT INTO proyectos (nombre, correo, archivo_path, nombre_fichero, descripcion) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, archivo.path, archivo.originalname, descripcion || null]
    );
    connection.release();

    res.json({ message: 'Archivo subido correctamente', id: result.insertId, redirectTo: '/confirmacion' });
  } catch (error) {
    next(error);
  }
});

// ===== ESTÁTICOS Y MANEJO DE ERRORES =====

app.use('/api', notFoundHandler); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Embudo de errores
app.use(multerErrorHandler);
app.use(validationErrorHandler);
app.use(authErrorHandler);
app.use(dbErrorHandler);
app.use(genericErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});