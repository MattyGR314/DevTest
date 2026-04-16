import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import ConfirmacionSubida from './pages/confirmacionSubida';
import IniciarSesion from './pages/iniciarSesion';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta independiente sin Layout */}
          <Route path="/iniciarSesion" element={<IniciarSesion />} />
          
          {/* Rutas con Layout */}
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/subircodigo" element={<SubirCodigo />} />
                <Route path="/confirmacion" element={<ConfirmacionSubida />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;