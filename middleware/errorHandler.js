/**
 * Middleware de manejo de errores para la aplicación.
 *
 * - dbErrorHandler captura errores típicos de MySQL (mysql2) y los transforma en respuestas JSON
 *   más amigables y con códigos de estado adecuados.
 * - genericErrorHandler es el manejador de respaldo para cualquier otro error.
 */

const showStack = process.env.NODE_ENV !== 'production';

/**
 * Maneja errores específicos de la base de datos MySQL.
 */
function dbErrorHandler(err, req, res, next) {
  // mysql2 error object includes `code`, `errno`, `sqlState`, `sqlMessage`
  if (err && typeof err.code === 'string') {
    console.error('💥 Error de BD detectado:', err.code, err.sqlMessage || err.message);

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

  // No es un error de base de datos conocido: delegar a un manejador general.
  next(err);
}

/**
 * Maneja errores genéricos que no fueron capturados por un middleware previo.
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

module.exports = {
  dbErrorHandler,
  genericErrorHandler,
};
