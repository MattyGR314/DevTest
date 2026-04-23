import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResultadoConsulta from './ResultadoConsulta';
// Requiere que exportes explícitamente AuthContext desde tu archivo AuthContext.js
import { AuthContext } from '../context/AuthContext'; 

describe('Unidad: DT07 - Descarga de Ejecutable', () => {
  const proyectoConArchivo = [{ id: 1, nombre: 'Proyecto Test', archivo_path: 'uploads/proyecto-test.exe', nombre_fichero: 'ProyectoTest.exe' }];
  const proyectoSinArchivo = [{ id: 2, nombre: 'Proyecto Sin Archivo', archivo_path: null, nombre_fichero: null }];

  const mountWithContext = (id, usuario, tipoUsuario) => {
    cy.mount(
      <AuthContext.Provider value={{ usuario, tipoUsuario }}>
        <MemoryRouter initialEntries={[`/resultado-consulta/${id}`]}>
          <Routes>
            <Route path="/resultado-consulta/:id" element={<ResultadoConsulta />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('Muestra descarga: tester inscrito con archivo existente', () => {
    cy.intercept('GET', '/api/proyectos*', { statusCode: 200, body: proyectoConArchivo }).as('reqProy');
    cy.intercept('GET', '/api/inscripciones/usuario*', { statusCode: 200, body: { ids: [1] } }).as('reqInsc');

    mountWithContext('1', 'tester@test.com', 'tester');
    cy.wait(['@reqProy', '@reqInsc']);

    cy.get('.btn-descarga')
      .should('be.visible')
      .and('have.attr', 'href', '/uploads/proyecto-test.exe')
      .and('have.attr', 'download');
  });

  it('Oculta descarga: archivo no registrado en el sistema', () => {
    cy.intercept('GET', '/api/proyectos*', { statusCode: 200, body: proyectoSinArchivo }).as('reqProy');
    cy.intercept('GET', '/api/inscripciones/usuario*', { statusCode: 200, body: { ids: [2] } }).as('reqInsc');

    mountWithContext('2', 'tester@test.com', 'tester');
    cy.wait(['@reqProy', '@reqInsc']);

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.inscrito-msg').should('be.visible');
  });

  it('Oculta descarga y exige inscripción: falta sesión', () => {
    cy.intercept('GET', '/api/proyectos*', { statusCode: 200, body: proyectoConArchivo }).as('reqProy');

    mountWithContext('1', null, null);
    cy.wait('@reqProy');

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.btn-participar').should('be.visible');
  });

  it('Oculta descarga y exige inscripción: tester no inscrito', () => {
    cy.intercept('GET', '/api/proyectos*', { statusCode: 200, body: proyectoConArchivo }).as('reqProy');
    cy.intercept('GET', '/api/inscripciones/usuario*', { statusCode: 200, body: { ids: [] } }).as('reqInsc');

    mountWithContext('1', 'tester@test.com', 'tester');
    cy.wait(['@reqProy', '@reqInsc']);

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.btn-participar').should('be.visible');
  });
});