/// <reference types="cypress" />

describe('DT_11 - Agregar descripción a un proyecto', () => {

  const visitUploadWithFallback = () => {
    cy.visit('/subircodigo', { failOnStatusCode: false });
    cy.get('body').then(($body) => {
      const altBaseUrl = Cypress.env('ALT_BASE_URL');
      if ($body.find('form#uploadCode').length === 0 && altBaseUrl) {
        cy.visit(`${altBaseUrl}/subircodigo`);
      }
    });

    cy.get('form#uploadCode').should('be.visible');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    visitUploadWithFallback();
  });

  // DT_11_1: Verificar que el formulario contiene el campo descripción
  it('DT_11_1: Verificar existencia del campo descripción', () => {
    cy.get('textarea#descripcion').should('be.visible');
    cy.get('label[for="descripcion"]').should('contain', 'Descripción del proyecto');
    cy.get('textarea#descripcion').should('have.attr', 'maxlength', '500');
  });

  // DT_11_2: Registro exitoso con descripción de hasta 500 caracteres
  it('DT_11_2: Registro exitoso con descripción válida (<=500 caracteres)', () => {
    cy.intercept('POST', '/subircodigo', {
      statusCode: 200,
      body: { message: 'Archivo subido correctamente', id: 10, redirectTo: '/confirmacion' }
    }).as('postExito');

    cy.get('input#nombre').type('Proyecto con Descripcion');
    cy.get('input#correo').type('developer@test.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/test-script.bat', { force: true });

    // Esperar confirmación visual de que React cargó el archivo
    cy.contains(/archivo seleccionado: test-script\.bat/i, { timeout: 10000 }).should('be.visible');

    // Descripción de 100 caracteres para probar la funcionalidad
    const descripcionValida = 'Esta es una descripción válida del proyecto que tiene menos de 500 caracteres para probar la funcionalidad.';
    cy.get('textarea#descripcion').type(descripcionValida);

    cy.contains('button', 'Aceptar').click();

    cy.wait('@postExito');
    cy.location('pathname').should('eq', '/confirmacion');
  });

  // DT_11_3: Rechazar descripción con más de 500 caracteres
  it('DT_11_3: Rechazar descripción con más de 500 caracteres', () => {
    cy.intercept('POST', '/subircodigo').as('postNoDebeSalir');

    cy.get('input#nombre').type('Proyecto Descripcion Larga');
    cy.get('input#correo').type('developer@test.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/test-script.bat', { force: true });

    // Esperar confirmación visual de que React cargó el archivo
    cy.contains(/archivo seleccionado: test-script\.bat/i, { timeout: 10000 }).should('be.visible');

    // Forzar descripción de 501 caracteres (maxLength lo previene, pero invoke permite)
    const descripcionInvalida = 'A'.repeat(501);
    cy.get('textarea#descripcion').invoke('val', descripcionInvalida).trigger('input').trigger('change');

    cy.contains('button', 'Aceptar').click();

    cy.contains(/la descripción no puede exceder 500 caracteres|la descripcion no puede exceder 500 caracteres/i).should('be.visible');
    cy.get('@postNoDebeSalir.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/subircodigo');
  });
});