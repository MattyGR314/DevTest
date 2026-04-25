import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VerFeedback from './VerFeedback';
import { AuthContext } from '../context/AuthContext';

// Stub para simular dependencias de enrutamiento y autenticación
const mountWithContext = (usuarioMock, idProyecto = '1') => {
  cy.mount(
    <AuthContext.Provider value={{ usuario: usuarioMock }}>
      <MemoryRouter initialEntries={[`/proyecto/${idProyecto}/ver-feedback`]}>
        <Routes>
          <Route path="/proyecto/:id/ver-feedback" element={<VerFeedback />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Prueba Unitaria de Componente DT09 - VerFeedback', () => {
  const apiEndpoint = '/api/proyectos/1/feedback';

  it('Debe mostrar error si no hay usuario autenticado (Estado local vacío)', () => {
    mountWithContext(null);
    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'Debes iniciar sesión para ver el feedback.');
  });

  it('Debe renderizar error 403 al simular respuesta denegada de la API', () => {
    cy.intercept('GET', apiEndpoint, {
      statusCode: 403,
      body: { error: 'Solo los dueños del proyecto pueden ver el feedback' }
    }).as('getFeedbackDenegado');

    mountWithContext('tester@ejemplo.com');
    cy.wait('@getFeedbackDenegado');

    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'No eres el dueño de este proyecto');
  });

  it('Debe renderizar error 404 al simular proyecto inexistente', () => {
    cy.intercept('GET', apiEndpoint, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' }
    }).as('getFeedbackNoEncontrado');

    mountWithContext('dueno@ejemplo.com');
    cy.wait('@getFeedbackNoEncontrado');

    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'El proyecto no existe.');
  });

  it('Debe renderizar estado vacío al recibir array sin datos (200)', () => {
    cy.intercept('GET', apiEndpoint, {
      statusCode: 200,
      body: []
    }).as('getFeedbackVacio');

    mountWithContext('dueno@ejemplo.com');
    cy.wait('@getFeedbackVacio');

    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'No hay feedback registrado para este proyecto.');
  });

  it('Debe aislar e inyectar datos simulados para renderizar la lista de feedback', () => {
    const mockData = [
      {
        id: 1,
        correo: 'tester@ejemplo.com',
        nombre_usuario: 'Juan Tester',
        texto: 'Simulación de prueba unitaria.',
        archivo_path: '123456-bug.png',
        nombre_fichero: 'bug.png',
        fecha_creacion: '2026-04-25T10:00:00Z'
      }
    ];

    cy.intercept('GET', apiEndpoint, {
      statusCode: 200,
      body: mockData
    }).as('getFeedbackExito');

    mountWithContext('dueno@ejemplo.com');
    cy.wait('@getFeedbackExito');

    cy.get('.feedback-lista').should('exist');
    cy.get('.feedback-item').should('have.length', 1);
    cy.get('.feedback-meta').should('contain.text', 'Juan Tester');
    cy.get('.feedback-texto').should('contain.text', 'Simulación de prueba unitaria.');
    cy.get('.feedback-archivo a').should('have.attr', 'href', '/uploads/123456-bug.png');
  });
});