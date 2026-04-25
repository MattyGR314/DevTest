/// <reference types="cypress" />

describe('Integración: DT07 - Descarga de Ejecutable (Conexión Real)', () => {

  before(() => {
    cy.exec('node infra/seed_dt07.js');
  });

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('Flujo completo: Componentes combinados y conexión real a la BD', () => {
    cy.visit('http://localhost:3000/resultado-consulta/1', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'tester@test.com');
        win.localStorage.setItem('usuario', 'tester@test.com'); 
        win.localStorage.setItem('correo', 'tester@test.com'); 
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga', { timeout: 10000 })
      .should('exist')
      .and('be.visible')
      .and('have.attr', 'download');
  });

  it('Flujo denegado: Base de datos confirma falta de archivo', () => {
    cy.visit('http://localhost:3000/resultado-consulta/2', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'tester@test.com');
        win.localStorage.setItem('usuario', 'tester@test.com');
        win.localStorage.setItem('correo', 'tester@test.com');
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.inscripcion-container').should('be.visible');
  });

  it('Flujo denegado: Fallo en conexión o falta de inscripción', () => {
    cy.visit('http://localhost:3000/resultado-consulta/2', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'tester@test.com');
        win.localStorage.setItem('usuario', 'tester@test.com');
        win.localStorage.setItem('correo', 'tester@test.com');
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.inscripcion-container').should('be.visible');
  });

  it('Flujo denegado: Sesión inactiva con conexión real', () => {
    cy.visit('http://localhost:3000/resultado-consulta/1');

    cy.get('.btn-descarga', { timeout: 10000 }).should('not.exist');
    cy.get('.inscripcion-container').should('be.visible');
  });

  it('Flujo denegado: Tester sin registro en tabla inscripciones real', () => {
    cy.visit('http://localhost:3000/resultado-consulta/1', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'no-inscrito@test.com'); 
        win.localStorage.setItem('usuario', 'no-inscrito@test.com'); 
        win.localStorage.setItem('correo', 'no-inscrito@test.com'); 
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga', { timeout: 10000 }).should('not.exist');
    cy.get('.inscripcion-container').should('be.visible'); 
  });

});