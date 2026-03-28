/**
 * Middleware de manejo de errores para la aplicación.
 *
 * - dbErrorHandler captura errores típicos de MySQL (mysql2) y los transforma en respuestas JSON
 *   más amigables y con códigos de estado adecuados.
 * - genericErrorHandler es el manejador de respaldo para cualquier otro error.
 */

/**
 * Middleware de manejo de errores para la aplicación.
 */
const multer = require('multer');
const showStack = process.env.NODE_ENV !== 'production';

/**
 * Maneja el error 404 (Ruta no encontrada) para la API
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 'error',
    message: `La ruta solicitada no existe: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Maneja errores específicos de subida de archivos (Multer)
 */
function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Errores nativos de Multer (ej. LIMIT_FILE_SIZE)
    return res.status(400).json({
      status: 'error',
      message: 'Error al procesar el archivo subido',
      code: err.code,
      details: err.message
    });
  } else if (err.message === 'File type not allowed') {
    // Error personalizado si en el futuro filtras por extensión
    return res.status(415).json({
      status: 'error',
      message: 'Tipo de archivo no soportado'
    });
  }
  
  // Si no es un error de Multer, pasamos al siguiente manejador
  next(err);
}

/**
 * Maneja errores de validación (estructurado para futuras librerías como Joi o express-validator)
 */
function validationErrorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Datos de entrada inválidos',
      details: err.message,
      // Si la librería envía un array de errores, lo pasamos
      ...(err.errors ? { errores: err.errors } : {}) 
    });
  }
  next(err);
}

/**
 * Maneja errores de autenticación y autorización (preparado para el futuro)
 */
function authErrorHandler(err, req, res, next) {
  if (err.name === 'UnauthorizedError' || err.code === 'credentials_required') {
    return res.status(401).json({
      status: 'error',
      message: 'No autorizado. Se requiere iniciar sesión.'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      status: 'error',
      message: 'No tienes permisos para realizar esta acción.'
    });
  }
  next(err);
}

/**
 * Maneja errores específicos de la base de datos MySQL.
 */
function dbErrorHandler(err, req, res, next) {
  if (err && typeof err.code === 'string') {
    // ... (Mantén exactamente el mismo código que ya tenías en tu dbErrorHandler)
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({
          error: 'Duplicado en la base de datos',
          message: err.sqlMessage || err.message,
          code: err.code,
          ...(showStack ? { stack: err.stack } : {}),
        });
      case 'ER_NO_SUCH_TABLE':
      case 'ER_BAD_TABLE_ERROR':
      case 'ER_BAD_DB_ERROR':
        return res.status(500).json({
          error: 'Error de esquema de base de datos',
          message: err.sqlMessage || err.message,
          code: err.code,
          ...(showStack ? { stack: err.stack } : {}),
        });
      case 'ER_BAD_FIELD_ERROR':
      case 'ER_PARSE_ERROR':
      case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
        return res.status(400).json({
          error: 'Error en la consulta de la base de datos',
          message: err.sqlMessage || err.message,
          code: err.code,
          ...(showStack ? { stack: err.stack } : {}),
        });
      case 'ER_CON_COUNT_ERROR':
      case 'ER_ACCESS_DENIED_ERROR':
      case 'ER_LOCK_WAIT_TIMEOUT':
      case 'ER_LOCK_DEADLOCK':
        return res.status(503).json({
          error: 'La base de datos está ocupada o no disponible',
          message: err.sqlMessage || err.message,
          code: err.code,
          ...(showStack ? { stack: err.stack } : {}),
        });
      default:
        break;
    }
  }
  next(err);
}

/**
 * Maneja errores genéricos (500)
 */
function genericErrorHandler(err, req, res, next) {
  console.error('Error inesperado:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    status: 'error',
    message: 'Ocurrió un error en el servidor',
    details: err.message,
    ...(showStack ? { stack: err.stack } : {}),
  });
}

// Exportamos todos los middlewares
module.exports = {
  notFoundHandler,
  multerErrorHandler,
  validationErrorHandler,
  authErrorHandler,
  dbErrorHandler,
  genericErrorHandler,
};