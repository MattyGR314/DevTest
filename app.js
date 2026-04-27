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

const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true';

if (isTestEnvironment) {
  console.log('🧪 ENTORNO DE PRUEBAS DETECTADO');
}

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

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const normalizeStoredPath = (value) => {
  if (!value || typeof value !== 'string') return null;
  return value.replace(/\\/g, '/').replace(/^\.?\//, '');
};

app.use('/api', apiLimiter); 

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

app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });

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

app.post('/api/registro', async (req, res) => {
  const { correo, contrasena, tipoCuenta } = req.body;
  if (!correo || !contrasena) return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });

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
    const normalizedRows = rows.map((row) => ({
      ...row,
      archivo_path: normalizeStoredPath(row.archivo_path)
    }));
    res.json(normalizedRows);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos', detalles: error.message });
  }
});

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
    res.json({
      ...rows[0],
      archivo_path: normalizeStoredPath(rows[0].archivo_path)
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

app.put('/api/proyectos/:id/descripcion', async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id, 10);
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (Number.isNaN(id)) return res.status(400).json({ error: 'El ID del proyecto no es válido' });
    if (descripcion.length > 500) return res.status(400).json({ error: 'La descripción no puede exceder 500 caracteres' });

    connection = await pool.getConnection();
    const [existingProject] = await connection.execute('SELECT id FROM proyectos WHERE id = ?', [id]);

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

    return res.json({ message: 'Descripción actualizada correctamente', id, descripcion: descripcion || null });
  } catch (error) {
    console.error('Error al actualizar descripción:', error);
    res.status(500).json({ error: 'Error al actualizar la descripción', detalles: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Integración de Inscripciones (Fusión Dev + DT07)
app.post('/api/inscripciones', async (req, res) => {
  try {
    console.log('📝 Registro de inscripción...');
    const { nombre, correo, id_proyectos } = req.body;

    if (!nombre || !nombre.trim()) {
      console.warn('⚠️ Nombre no proporcionado');
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!correo || !correo.trim()) {
      console.warn('⚠️ Correo no proporcionado');
      return res.status(400).json({ error: 'El correo es obligatorio' });
    }

    if (!id_proyectos || isNaN(id_proyectos)) {
      console.warn('⚠️ ID de proyecto inválido');
      return res.status(400).json({ error: 'ID de proyecto inválido' });
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo.trim())) {
      console.warn('⚠️ Correo inválido:', correo);
      return res.status(400).json({ error: 'El formato del correo no es válido' });
    }

    console.log('🔄 Conectando a BD...');
    const connection = await pool.getConnection();

    const [tableCheck] = await connection.query('SHOW TABLES LIKE "inscripciones"');
    if (tableCheck.length === 0) {
      connection.release();
      throw new Error('La tabla "inscripciones" no existe. Ejecuta: node infra/setup_database.js');
    }

    // Validación requerida: solo el proyecto debe existir
    const [proyecto] = await connection.execute('SELECT id FROM proyectos WHERE id = ?', [id_proyectos]);
    
    if (proyecto.length === 0) {
      connection.release();
      console.warn('⚠️ Proyecto no encontrado');
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Comprobación de inscripción duplicada
    const [yaInscrito] = await connection.execute(
      'SELECT id FROM inscripciones WHERE correo = ? AND id_proyectos = ?',
      [correo.trim(), parseInt(id_proyectos, 10)]
    );
    
    if (yaInscrito.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Ya estás inscrito en este proyecto' });
    }

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
    res.status(500).json({ error: 'Error al guardar la inscripción', detalles: error.message });
  }
});

app.get('/api/inscripciones/check', async (req, res) => {
  const { correo, id_proyectos } = req.query;
  if (!correo || !id_proyectos || isNaN(id_proyectos)) return res.status(400).json({ error: 'Parámetros inválidos' });
  
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id FROM inscripciones WHERE correo = ? AND id_proyectos = ?',
      [correo.trim(), parseInt(id_proyectos, 10)]
    );
    connection.release();
    res.json({ inscrito: rows.length > 0 });
  } catch (error) {
    console.error('Error al verificar inscripción:', error);
    res.status(500).json({ error: 'Error al verificar inscripción' });
  }
});

app.get('/api/inscripciones/usuario', async (req, res) => {
  const { correo } = req.query;
  if (!correo || !correo.trim()) return res.status(400).json({ error: 'El correo es obligatorio' });

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id_proyectos FROM inscripciones WHERE correo = ?', [correo.trim()]);
    connection.release();
    res.json({ ids: rows.map(r => r.id_proyectos) });
  } catch (error) {
    console.error('Error al obtener inscripciones del usuario:', error);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

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
    console.log('📝 Inicio de subida de archivo...');
    const { nombre, correo } = req.body;
    const archivo = req.file;
    const filePath = archivo ? path.posix.join('uploads', archivo.filename) : null;
    const nombreFichero = archivo ? archivo.originalname : null;
    const descripcion = req.body.descripcion || null;

    if (!nombre) return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
    if (!correo) return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    if (!archivo) return res.status(400).json({ error: 'El archivo es obligatorio' });

    const connection = await pool.getConnection();
    const [tableCheck] = await connection.query('SHOW TABLES LIKE "proyectos"');
    if (tableCheck.length === 0) throw new Error('La tabla "proyectos" no existe.');

    if (!isTestEnvironment) {
      const [existingProject] = await connection.execute('SELECT id FROM proyectos WHERE nombre = ?', [nombre]);
      if (existingProject.length > 0) {
        connection.release();
        return res.status(409).json({ error: 'Ya existe un proyecto con este nombre', codigo: 'NOMBRE_DUPLICADO' });
      }
    }

    const [result] = await connection.execute(
      'INSERT INTO proyectos (nombre, correo, archivo_path, nombre_fichero, descripcion) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, filePath, nombreFichero, descripcion]
    );
    
    connection.release();
    res.json({ message: 'Archivo subido correctamente', id: result.insertId, nombre, correo, archivo: archivo.filename, nombre_fichero: nombreFichero, descripcion, redirectTo: '/confirmacion' });
  } catch (error) {
    console.error('❌ Error al guardar proyecto:', error);
    next(error);
  }
});

app.post('/api/feedback', upload.single('archivo'), async (req, res) => {
  const { correo, id_proyectos, texto } = req.body;

  if (!correo || !correo.trim()) return res.status(400).json({ error: 'El correo es obligatorio' });
  if (!id_proyectos || isNaN(id_proyectos)) return res.status(400).json({ error: 'ID de proyecto inválido' });
  if (!texto || !texto.trim()) return res.status(400).json({ error: 'Los comentarios no pueden estar vacíos' });
  if (texto.trim().length > 1000) return res.status(400).json({ error: 'El feedback no puede exceder 1000 caracteres' });
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar al menos un documento' });

  const idProyecto = parseInt(id_proyectos, 10);

  try {
    const connection = await pool.getConnection();
    const [proyectoRows] = await connection.execute('SELECT id FROM proyectos WHERE id = ?', [idProyecto]);
    if (proyectoRows.length === 0) {
      connection.release();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'El proyecto no existe o ha sido borrado' });
    }

    const [inscripcion] = await connection.execute('SELECT id FROM inscripciones WHERE correo = ? AND id_proyectos = ?', [correo.trim(), idProyecto]);
    if (inscripcion.length === 0) {
      connection.release();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Solo los testers inscritos pueden enviar feedback' });
    }

    await connection.execute(
      'INSERT INTO feedback (correo, id_proyectos, texto, archivo_path, nombre_fichero) VALUES (?, ?, ?, ?, ?)',
      [correo.trim(), idProyecto, texto.trim(), req.file.filename, req.file.originalname]
    );
    connection.release();
    res.status(201).json({ message: 'Feedback enviado correctamente' });
  } catch (error) {
    console.error('Error al guardar feedback:', error);
    res.status(500).json({ error: 'Error al guardar el feedback', detalles: error.message });
  }
});

app.use('/api', notFoundHandler); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.exe' || ext === '.bat') {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));
app.use(express.static(path.join(__dirname, "build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(multerErrorHandler);
app.use(validationErrorHandler);
app.use(authErrorHandler);
app.use(dbErrorHandler);
app.use(genericErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});