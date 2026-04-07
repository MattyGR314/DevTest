require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  
  try {
    // Conectar a MySQL sin especificar base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✓ Conectado a MySQL');

    const dbName = process.env.DB_NAME || 'devtest';

    // Crear base de datos
    console.log(`📊 Creando base de datos "${dbName}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✓ Base de datos "${dbName}" lista`);

    // Usar la base de datos
    await connection.query(`USE ${dbName}`);
    console.log(`✓ Usando base de datos "${dbName}"`);

    // Crear tabla proyectos
    console.log('📋 Creando tabla "proyectos"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        archivo_path VARCHAR(500),
        correo VARCHAR(255),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        correo VARCHAR(255)
      )
    `);
    console.log('✓ Tabla "proyectos" creada correctamente');

    // Crear tabla inscripciones
    console.log('📋 Creando tabla "inscripciones"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inscripciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_proyectos INT,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) NOT NULL,
        CONSTRAINT fk_proyecto
          FOREIGN KEY (id_proyectos)
          REFERENCES proyectos(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `);
    console.log('✓ Tabla "inscripciones" creada correctamente');

    console.log('\n✅ Base de datos configurada correctamente');
    console.log(`   Base de datos: ${dbName}`);
    console.log('   Tablas: proyectos, inscripciones');
    console.log('   Tabla proyectos - Campos: id, nombre, archivo_path, correo, fecha_creacion');
    console.log('   Tabla inscripciones - Campos: id, nombre, correo, id_proyectos, fecha_inscripcion');

    await connection.end();
  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error.message);
    console.error('\nVerifica que:');
    console.error('1. MySQL está corriendo');
    console.error('2. Las credenciales en .env son correctas');
    console.error('3. El archivo .env existe en la raíz del proyecto');
    process.exit(1);
  }
}

setupDatabase();
