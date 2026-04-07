import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import ConfirmacionSubida from './pages/confirmacionSubida';

import Busqueda from './pages/Busqueda';  // DT_10_T1
import ResultadoConsulta from './pages/ResultadoConsulta';
import Registro from './pages/Registro';

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
          <Route path="/busqueda" element={<Busqueda />} /> {/*DT_10_T1*/}
          <Route path="/resultado-consulta/:id" element={<ResultadoConsulta />} />

        </Routes>
      </Layout>
    </Router>
    </AuthProvider>
  );
}

export default App;
