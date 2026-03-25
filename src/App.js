import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import ConfirmacionSubida from './pages/confirmacionSubida';
import IniciarSesion from './pages/iniciarSesion';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/subircodigo" element={<SubirCodigo />} />
          <Route path="/confirmacion" element={<ConfirmacionSubida />} />
          <Route path="/iniciarSesion" element={<IniciarSesion />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
