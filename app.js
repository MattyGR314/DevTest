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

// Si es entorno de pruebas, deshabilitar la verificación de duplicados
// o usar una base de datos de prueba
if (isTestEnvironment) {
  console.log('🧪 ENTORNO DE PRUEBAS DETECTADO');
}

// ===== CONFIGURACIÓN DE RATE LIMIT (ERROR 429) =====
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 30, // Límite estricto: máximo 30 subidas por IP cada 15 minutos
  standardHeaders: true, 
  legacyHeaders: false,
  // Esta es la respuesta 429 que verá el cliente:
  message: {
    status: 'error',
    message: 'Demasiadas peticiones desde esta IP. Por favor, intenta de nuevo en 15 minutos.',
    code: 'TOO_MANY_REQUESTS'
  },
  skip: (req, res) => isTestEnvironment
});

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100, // 100 peticiones por IP a la API en general
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

// ===== RUTAS API (ANTES de archivos estáticos) =====

app.use('/api', apiLimiter); // Aplica el limitador a todas las rutas que comienzan con /api

// Ruta para verificar estado de conexión a BD
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

// Ruta de prueba - obtener datos de la BD
app.get('/api/test', async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() as current_database;');
    connection.release();
    res.json({ message: 'Conectado a la BD', data: rows });
  } catch (error) {
    console.error('Error en query:', error);
    next(error);
  }
});


// ===== RUTA DE REGISTRO =====
app.post('/api/registro', async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const connection = await pool.getConnection();

    const [existing] = await connection.execute(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    await connection.execute(
      'INSERT INTO usuarios (correo, password_hash) VALUES (?, ?)',
      [correo, contrasena]
    );
    connection.release();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ===== RUTA DE INICIO DE SESIÓN =====
app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT correo, password_hash FROM usuarios WHERE correo = ?',
      [correo]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no registrado' });
    }

    if (rows[0].password_hash !== contrasena) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json({ correo: rows[0].correo });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
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
app.post('/subircodigo', uploadLimiter, upload.single('archivo'), async (req, res, next) => {
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
    const descripcion = req.body.descripcion || null;

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

    console.log('🔍 Verificando tabla inscripciones...');
    const [inscripcionesTableCheck] = await connection.query('SHOW TABLES LIKE "inscripciones"');
    if (inscripcionesTableCheck.length === 0) {
      console.warn('⚠️  La tabla "inscripciones" no existe. No es posible verificar correo registrado.');
      connection.release();
      return res.status(500).json({
        error: 'Tabla inscripciones no encontrada. Imposible validar correo de usuario registrado.',
        codigo: 'INSCRIPCIONES_TABLE_NO_EXISTE'
      });
    }
    console.log('✓ Tabla inscripciones existe');

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

      // DT_XX: Verificar que el correo pertenece a una inscripción
      console.log('🔍 Verificando si el correo está registrado en inscripciones...');
      const [inscripcionCheck] = await connection.execute(
        'SELECT id FROM inscripciones WHERE correo = ?',
        [correo]
      );

      if (inscripcionCheck.length === 0) {
        console.warn('⚠️  Correo no está vinculado a ninguna inscripción:', correo);
        connection.release();
        return res.status(400).json({ 
          error: 'El correo debe estar vinculado a una inscripción registrada',
          codigo: 'USUARIO_NO_REGISTRADO'
        });
      }
      console.log('✓ Correo verificado como inscripción registrada');
    } else {
      console.log('🧪 Entorno de pruebas: omitiendo verificación de duplicados y usuarios');
    }

    // Insertar en la base de datos (SIN campo estado)
    console.log('📥 Insertando datos en BD...');
    const [result] = await connection.execute(
      'INSERT INTO proyectos (nombre, correo, archivo_path, descripcion) VALUES (?, ?, ?, ?)',
      [nombre, correo, filePath, descripcion]
    );
    console.log('✓ Datos insertados. ID:', result.insertId);

    connection.release();

    return res.json({ 
      message: 'Archivo subido correctamente',
      id: result.insertId,
      nombre: nombre,
      correo: correo,
      archivo: archivo ? archivo.filename : null,
      descripcion: descripcion,
      redirectTo: '/confirmacion'
      });
    
  } catch (error) {
    console.error('❌ Error al guardar proyecto:', error.message);
    console.error('Error completo:', error);
    next(error);
  }
});

// ===== DT_10_T1 RUTA PARA OBTENER PROYECTOS =====
app.get('/api/proyectos', async (req, res) => {
  try {
    const termino = req.query.q;      // Término de búsqueda
    const campo = req.query.campo;    // Campo a buscar: 'nombre', 'id', 'descripcion'

    const connection = await pool.getConnection();

    let query = '';
    let params = [];

    // Si hay término de búsqueda, construimos la consulta según el campo
    if (termino && termino.trim() !== '') {
      switch (campo) {
        case 'id':
          // Buscar por ID exacto (convertir a número si es posible)
          const idBuscado = parseInt(termino, 10);
          if (isNaN(idBuscado)) {
            query = 'SELECT * FROM proyectos WHERE 1 = 0';
          } else {
            query = 'SELECT * FROM proyectos WHERE id = ?';
            params = [idBuscado];
          }
          break;
        case 'descripcion':
          // Buscar por descripción (coincidencia parcial, insensible a mayúsculas)
          query = 'SELECT * FROM proyectos WHERE descripcion LIKE ?';
          params = [`%${termino}%`];
          break;
        case 'nombre':
        default:
          // Buscar por nombre (coincidencia parcial, insensible a mayúsculas)
          query = 'SELECT * FROM proyectos WHERE nombre LIKE ?';
          params = [`%${termino}%`];
          break;
      }
    } else {
      // Sin término: obtener todos los proyectos ordenados por fecha descendente
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

app.put('/api/proyectos/:id/descripcion', async (req, res) => {
  let connection;

  try {
    const id = parseInt(req.params.id, 10);
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'El ID del proyecto no es válido' });
    }

    if (descripcion.length > 500) {
      return res.status(400).json({ error: 'La descripción no puede exceder 500 caracteres' });
    }

    connection = await pool.getConnection();

    const [existingProject] = await connection.execute(
      'SELECT id FROM proyectos WHERE id = ?',
      [id]
    );

    if (existingProject.length === 0) {
      connection.release();
      connection = null;
      return res.status(404).json({ error: 'No existe un proyecto con ese ID' });
    }

    await connection.execute(
      'UPDATE proyectos SET descripcion = ? WHERE id = ?',
      [descripcion || null, id]
    );

    connection.release();
    connection = null;

    return res.json({
      message: 'Descripción actualizada correctamente',
      id,
      descripcion: descripcion || null,
    });
  } catch (error) {
    console.error('Error al actualizar descripción:', error);
    res.status(500).json({ error: 'Error al actualizar la descripción', detalles: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== 1. MANEJO DE 404 PARA LA API =====
// Atrapa peticiones a /api/* que no coinciden con ninguna ruta definida
// Movido a aquí en DT_5 como este orden impide los además a funcionar
app.use('/api', notFoundHandler); 

// ===== ARCHIVOS ESTÁTICOS (React) =====
app.use(express.static(path.join(__dirname, "build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ===== 3. EMBUDO DE MANEJO DE ERRORES =====
// Si cualquier ruta hace next(error), caerá por este embudo en orden:

app.use(multerErrorHandler);     // error al subir un archivo
app.use(validationErrorHandler); // error de datos mal formateados
app.use(authErrorHandler);       // error de sesión o permisos
app.use(dbErrorHandler);         // error de MySQL
app.use(genericErrorHandler);    // Si no fue ninguno de los anteriores, es un 500 genérico.

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
