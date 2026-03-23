import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import SeleccionarProyecto from './pages/SeleccionarProyecto';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/subircodigo" element={<SubirCodigo />} />
          <Route path="/seleccionarproyecto/:id" element={<SeleccionarProyecto />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
