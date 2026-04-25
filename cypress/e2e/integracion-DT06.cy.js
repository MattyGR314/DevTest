/* global cy */
describe('Pruebas de Integración - DT06 Seleccionar Proyecto', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('INT_01: Integración con AuthContext (Top-Down)', () => {
    window.localStorage.setItem('usuario_correo', 'tester@ucm.es');
    window.localStorage.setItem('usuario_tipo', 'developer');

    cy.visit('/seleccionarproyecto/1');

    cy.get('input[name="correo"]').should('be.disabled');
    cy.get('input[name="correo"]').should('have.value', 'tester@ucm.es');
  });

  it('INT_02: Integración Frontend, API y Base de Datos (Bottom-Up)', () => {
    // 1. Inyectar usuario en BD real usando el endpoint disponible
    cy.request({
      method: 'POST',
      url: '/api/registro',
      body: { correo: 'nuevo_tester@ucm.es', contrasena: '1234', tipoCuenta: 'developer' },
      failOnStatusCode: false
    });

    // 2. Inyectar proyecto (id: 1) en BD real.
    // Es imperativo que exista el registro en la tabla 'proyectos'.
    // No dispongo de esa información para poblarlo vía API sin usar un archivo, 
    // se sugiere usar cy.exec() con tu script de semillas si incluye el ID 1:
    // cy.exec('node infra/seed_dt07.js', { failOnNonZeroExit: false });

    cy.intercept('POST', '/api/inscripciones').as('postInscripcion');

    cy.visit('/seleccionarproyecto/1');

    cy.get('input[name="nombre"]').type('Estudiante UCM');
    cy.get('input[name="correo"]').type('nuevo_tester@ucm.es');
    cy.get('button[type="submit"]').click();

    cy.wait('@postInscripcion').its('response.statusCode').should('eq', 201);

    cy.window().then((win) => {
      const inscripciones = JSON.parse(win.localStorage.getItem('mis_inscripciones') || '{}');
      expect(inscripciones['nuevo_tester@ucm.es']).to.include(1);
    });
  });

  it('INT_03: Manejo de errores de conexión y duplicados', () => {
    cy.intercept('POST', '/api/inscripciones', {
      statusCode: 409,
      body: { error: 'Ya estás inscrito en este proyecto' }
    }).as('postDuplicado');

    cy.visit('/seleccionarproyecto/1');

    cy.get('input[name="nombre"]').type('Estudiante UCM');
    cy.get('input[name="correo"]').type('duplicado@ucm.es');
    cy.get('button[type="submit"]').click();

    cy.wait('@postDuplicado');

    cy.contains('Ya estás inscrito en este proyecto').should('be.visible');
  });
});