import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import SubirCodigo from './pages/SubirCodigo';
import Busqueda from './pages/Busqueda';  // DT_10_T1
import ResultadoConsulta from './pages/ResultadoConsulta';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/subircodigo" element={<SubirCodigo />} />
          <Route path="/busqueda" element={<Busqueda />} /> {/*DT_10_T1*/}
          <Route path="/resultado-consulta/:id" element={<ResultadoConsulta />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
