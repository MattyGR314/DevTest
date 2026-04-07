/// <reference types="cypress" />

describe('DT_11 - Agregar descripción a un proyecto', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/subircodigo');

    // Ya no necesitamos el stub del alert, la app ahora usa mensajes en el DOM y redirecciones
    cy.get('form#uploadCode').should('be.visible');
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
      body: { message: 'Archivo subido correctamente' }
    }).as('postExito');

    cy.get('input#nombre').type('Proyecto con Descripcion');
    cy.get('input#correo').type('developer@test.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });

    // Esperar confirmación visual de que React cargó el archivo
    cy.contains('Archivo seleccionado: programa.exe', { timeout: 10000 }).should('be.visible');

    // Descripción de 100 caracteres para probar la funcionalidad
    const descripcionValida = 'Esta es una descripción válida del proyecto que tiene menos de 500 caracteres para probar la funcionalidad.';
    cy.get('textarea#descripcion').type(descripcionValida);

    cy.contains('button', 'Aceptar').click();

    cy.wait('@postExito');
    
    // NUEVA ASERCIÓN: Verificamos que redirige a la página de confirmación como hace el código actual
    cy.url().should('include', '/confirmacion');
  });

  // DT_11_3: Rechazar descripción con más de 500 caracteres
  it('DT_11_3: Rechazar descripción con más de 500 caracteres', () => {
    cy.get('input#nombre').type('Proyecto Descripcion Larga');
    cy.get('input#correo').type('developer@test.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });

    // Esperar confirmación visual de que React cargó el archivo
    cy.contains('Archivo seleccionado: programa.exe', { timeout: 10000 }).should('be.visible');

    // SOLUCIÓN: Removemos el maxlength del HTML y obligamos a Cypress a teclear 
    // para que el estado de React se actualice correctamente
    const descripcionInvalida = 'A'.repeat(501);
    cy.get('textarea#descripcion')
      .invoke('removeAttr', 'maxlength')
      .type(descripcionInvalida, { delay: 0 });

    cy.contains('button', 'Aceptar').click();

    // Verificamos que se muestra el mensaje de error específico debajo del textarea
    cy.get('textarea#descripcion')
      .parent()
      .find('.error-message')
      .should('be.visible')
      .and('contain', 'La descripción no puede exceder 500 caracteres');
  });
});