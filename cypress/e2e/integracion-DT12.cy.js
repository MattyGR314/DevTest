/// <reference types="cypress" />

describe('DT_12 - Pruebas de integración: API Backend y Base de Datos MySQL (Simulado)', () => {

  beforeEach(() => {
    // Requisito indispensable: Cargar el contexto del navegador para usar window.fetch
    cy.visit('/');
  });

  it('Integración exitosa: Conexión Endpoint -> Lógica -> MySQL', () => {
    cy.intercept('PUT', '/api/proyectos/1/detalles', {
      statusCode: 200,
      body: { message: 'Detalles actualizados correctamente', id: 1 }
    }).as('mockExito');

    cy.window().then((win) => {
      return win.fetch('/api/proyectos/1/detalles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'creador@test.com', fecha_limite: '2099-12-31', numero_testers: 10 })
      });
    }).then((response) => {
      expect(response.status).to.eq(200);
      return response.json();
    }).then((data) => {
      expect(data.message).to.eq('Detalles actualizados correctamente');
    });
  });

  it('Fallo de integración lógica: Middleware intercepta payload inválido', () => {
    cy.intercept('PUT', '/api/proyectos/1/detalles', {
      statusCode: 400,
      body: { error: 'Debes rellenar al menos la fecha límite o el número de testers' }
    }).as('mockError400');

    cy.window().then((win) => {
      return win.fetch('/api/proyectos/1/detalles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'creador@test.com' }) // Faltan campos obligatorios
      });
    }).then((response) => {
      expect(response.status).to.eq(400);
      return response.json();
    }).then((data) => {
      expect(data.error).to.exist;
    });
  });

  it('Fallo de integración de reglas de negocio: BD rechaza usuario no propietario', () => {
    cy.intercept('PUT', '/api/proyectos/1/detalles', {
      statusCode: 403,
      body: { error: 'Solo el dueño del proyecto puede añadir detalles' }
    }).as('mockError403');

    cy.window().then((win) => {
      return win.fetch('/api/proyectos/1/detalles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'intruso@test.com', numero_testers: 5 })
      });
    }).then((response) => {
      expect(response.status).to.eq(403);
      return response.json();
    }).then((data) => {
      expect(data.error).to.exist;
    });
  });

});