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

  it('INT_02: Integración Frontend y Persistencia Local (Top-Down)', () => {
    // Stubs para evadir la restricción del proxy en el entorno CI
    cy.intercept('GET', '/api/proyectos/1', { 
      statusCode: 200, 
      body: { id: 1, nombre: 'Proyecto de Integración' } 
    }).as('getProyecto');
    
    cy.intercept('POST', '/api/inscripciones', { 
      statusCode: 201 
    }).as('postInscripcion');

    cy.visit('/seleccionarproyecto/1');
    cy.wait('@getProyecto');

    cy.get('input[name="nombre"]').type('Estudiante UCM');
    cy.get('input[name="correo"]').type('nuevo_tester@ucm.es');
    cy.get('button[type="submit"]').click();

    cy.wait('@postInscripcion');

    // Validación de integración con módulo de almacenamiento (DT07)
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