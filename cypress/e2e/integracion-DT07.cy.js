describe('Integración: DT07 - Descarga de Ejecutable (Conexión Real)', () => {

  before(() => {
    // Preparo la base de datos real inyectando los registros necesarios antes de empezar
    cy.exec('node infra/seed_dt07.js');
  });

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('Flujo completo: Componentes combinados y conexión real a la BD', () => {
    // Al navegar, los módulos (Frontend -> API -> BD MySQL) interactúan en la realidad
    cy.visit('/resultado-consulta/1', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'tester@test.com');
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    // Ahora la API devolverá el proyecto 1 real y la inscripción, mostrando el botón
    cy.get('.btn-descarga', { timeout: 10000 })
      .should('exist')
      .and('be.visible')
      .and('have.attr', 'download');
  });

  it('Flujo denegado: Base de datos confirma falta de archivo', () => {
    // Visito el proyecto 2, que fue inyectado intencionalmente sin archivo_path
    cy.visit('/resultado-consulta/2', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'tester@test.com');
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.btn-participar')
      .should('be.visible');
  });
});

  it('Flujo denegado: Fallo en conexión o falta de inscripción', () => {
    // Se prueba con un ID (ej. 2) que en la BD real no tenga archivo o inscripción.
    cy.visit('/resultado-consulta/2', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', 'tester@test.com');
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga').should('not.exist');
    cy.get('.btn-participar')
      .should('be.visible');

  });

  it('Flujo denegado: Sesión inactiva con conexión real', () => {
    // Navegación sin inyectar datos en localStorage
    cy.visit('/resultado-consulta/1');

    cy.get('.btn-descarga', { timeout: 10000 }).should('not.exist');
    cy.get('.btn-participar').should('be.visible');
  });

  it('Flujo denegado: Tester sin registro en tabla inscripciones real', () => {
    cy.visit('/resultado-consulta/1', {
      onBeforeLoad(win) {
        // Correo no inyectado en seed_dt07.js
        win.localStorage.setItem('usuario_correo', 'no-inscrito@test.com'); 
        win.localStorage.setItem('usuario_tipo', 'tester');
      },
    });

    cy.get('.btn-descarga', { timeout: 10000 }).should('not.exist');
    cy.get('.btn-participar').should('be.visible');
  });