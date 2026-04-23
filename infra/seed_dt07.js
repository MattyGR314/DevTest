require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedDatabase() {
  try {
    const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'devtest',
  ssl: {
    rejectUnauthorized: false // Habilita SSL evadiendo validación estricta de certificado local
  }
});

    // 1. Limpio datos previos para evitar conflictos de claves primarias
    await connection.query('DELETE FROM inscripciones WHERE id_proyectos = 1 OR id_proyectos = 2');
    await connection.query('DELETE FROM proyectos WHERE id = 1 OR id = 2');

    // 2. Inserto el proyecto 1 (con archivo) que pasará la prueba
    await connection.query(`
      INSERT INTO proyectos (id, nombre, archivo_path, correo)
      VALUES (1, 'Proyecto Integracion DT07', 'uploads/app-test.exe', 'dev@test.com')
    `);

    // 3. Inserto el proyecto 2 (sin archivo) para el caso de error
    await connection.query(`
      INSERT INTO proyectos (id, nombre, archivo_path, correo)
      VALUES (2, 'Proyecto Sin Archivo', NULL, 'dev@test.com')
    `);

    // 4. Inscribo al tester en el proyecto 1
    await connection.query(`
      INSERT INTO inscripciones (id_proyectos, nombre, correo)
      VALUES (1, 'Tester Prueba', 'tester@test.com')
    `);

    await connection.end();
  } catch (error) {
    console.error('Error al inyectar datos de prueba:', error.message);
    process.exit(1);
  }
}

seedDatabase();