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
    // 1. Inyectar usuario en BD real
    cy.request({
      method: 'POST',
      url: '/api/registro',
      body: { correo: 'nuevo_tester@ucm.es', contrasena: '1234', tipoCuenta: 'developer' },
      failOnStatusCode: false
    });

    // 2. Crear un proyecto dinámicamente para asegurar su existencia en la BD
    cy.visit('/subircodigo');
    cy.get('input[name="nombre"]').type('Proyecto Integracion DT06');
    cy.get('input[name="correo"]').type('nuevo_tester@ucm.es');
    // Utilizo el archivo existente en tu estructura de directorios
    cy.get('input[type="file"]').selectFile('cypress/fixtures/documento.txt');
    cy.get('button[type="submit"]').click();
    
    // Esperar a que la redirección confirme la inserción en BD
    cy.url().should('include', '/confirmacion');

    // 3. Obtener el ID real generado y ejecutar la inscripción
    cy.request('/api/proyectos').then((res) => {
      // Tomo el ID del último proyecto insertado (el que acabo de crear)
      const idProyectoReal = res.body[0].id;

      cy.intercept('POST', '/api/inscripciones').as('postInscripcion');
      cy.visit(`/seleccionarproyecto/${idProyectoReal}`);

      cy.get('input[name="nombre"]').type('Estudiante UCM');
      cy.get('input[name="correo"]').type('nuevo_tester@ucm.es');
      cy.get('button[type="submit"]').click();

      cy.wait('@postInscripcion').its('response.statusCode').should('eq', 201);

      cy.window().then((win) => {
        const inscripciones = JSON.parse(win.localStorage.getItem('mis_inscripciones') || '{}');
        expect(inscripciones['nuevo_tester@ucm.es']).to.include(idProyectoReal);
      });
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