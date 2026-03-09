"use strict"

require('dotenv').config();
const express = require("express");
const path = require("path");
const mysql = require('mysql2/promise');

const app = express();

// Pool de conexiones a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
    console.log(`✓ Servidor React en puerto ${PORT}`);
    console.log(`✓ Abre http://localhost:${PORT} en tu navegador`);
    console.log(`✓ BD: ${process.env.DB_HOST || 'No configurada'}`);
    console.log(`✓ Base de datos: ${process.env.DB_NAME || 'No configurada'}`);
    console.log(`✓ Prueba conexión: http://localhost:${PORT}/api/health`);
  }
});