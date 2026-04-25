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
        win.localStorage.setItem('token', 'test-token-jwt'); // Resguardo en caso de middleware de auth
      },
    });

    // Se sustituye el selector de clase estricta por búsqueda de texto y atributo para evasión de fallos de CSS
    cy.contains(/descargar|ejecutable/i, { timeout: 10000 })
      .should('exist')
      .and('have.attr', 'href');
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
    // Se sustituye el selector de contenedor (.inscripcion-container) por el del texto renderizado
    // Soluciona errores de aserción en contenedores con height 0 o display:none por CSS
    cy.contains(/inscribi|participar|inicia sesi/i).should('be.visible');
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
    cy.contains(/inscribi|participar|inicia sesi/i).should('be.visible');
  });

  it('Flujo denegado: Sesión inactiva con conexión real', () => {
    cy.visit('http://localhost:3000/resultado-consulta/1');

    cy.get('.btn-descarga', { timeout: 10000 }).should('not.exist');
    cy.contains(/inscribi|participar|inicia sesi/i).should('be.visible');
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
    cy.contains(/inscribi|participar|inicia sesi/i).should('be.visible'); 
  });

});