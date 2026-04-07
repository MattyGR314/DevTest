import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import SeleccionarProyecto from './pages/SeleccionarProyecto';
import ConfirmacionSubida from './pages/confirmacionSubida';
import Busqueda from './pages/Busqueda';
import ResultadoConsulta from './pages/ResultadoConsulta';
import Registro from './pages/Registro';
import SeleccionarProyecto from './pages/SeleccionarProyecto';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/subircodigo" element={<SubirCodigo />} />
            <Route path="/confirmacion" element={<ConfirmacionSubida />} /> 
            <Route path="/busqueda" element={<Busqueda />} /> 
            <Route path="/resultado-consulta/:id" element={<ResultadoConsulta />} />
            <Route path="/seleccionarproyecto/:id" element={<SeleccionarProyecto />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
