import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import SeleccionarProyecto from './pages/SeleccionarProyecto';
import ConfirmacionSubida from './pages/confirmacionSubida';
import IniciarSesion from './pages/iniciarSesion';
import Busqueda from './pages/Busqueda';
import ResultadoConsulta from './pages/ResultadoConsulta';
import Registro from './pages/Registro';
import FeedbackProyecto from './pages/FeedbackProyecto';
import VerFeedback from './pages/VerFeedback';
import DetallesProyecto from './pages/DetallesProyecto';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas independientes sin Layout */}
          <Route path="/iniciarSesion" element={<IniciarSesion />} />
          
          {/* Rutas con Layout */}
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/subircodigo" element={<SubirCodigo />} />
                <Route path="/confirmacion" element={<ConfirmacionSubida />} /> 
                <Route path="/busqueda" element={<Busqueda />} /> 
                <Route path="/resultado-consulta/:id" element={<ResultadoConsulta />} />
                <Route path="/seleccionarproyecto/:id" element={<SeleccionarProyecto />} />
                <Route path="/feedback/:id" element={<FeedbackProyecto />} />
                <Route path="/proyecto/:id/ver-feedback" element={<VerFeedback />} />
                <Route path="/detalles-proyecto/:id" element={<DetallesProyecto />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
