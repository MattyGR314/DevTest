/// <reference types="cypress" />

describe('Prueba específica - Envío con éxito', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/subircodigo', {
      onBeforeLoad(win) {
        cy.stub(win, 'alert').as('alert');
      },
    });
  });

  it('debería enviar el formulario con éxito (mock)', () => {
    // 1. Interceptamos la ruta
    cy.intercept('POST', '**/subircodigo', {
      statusCode: 200,
      body: { message: 'Archivo subido correctamente' }
    }).as('subirArchivoMock');

    // 2. RELLENAR CON ESPERAS EXPLÍCITAS PARA REACT
    // Usamos {delay: 0} para rapidez pero trigger('change') para asegurar el estado
    cy.get('input#nombre')
      .should('be.visible')
      .type('Proyecto Test')
      .trigger('change'); // Forzamos a React a ver el cambio

    cy.get('input#correo')
      .should('be.visible')
      .type('test@email.com')
      .trigger('change');

    // 3. SELECCIONAR ARCHIVO
    // Asegúrate que el archivo existe en cypress/fixtures/programa.exe
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });

    // 4. ESPERAR UN MOMENTO A QUE EL ESTADO SE ASIENTE
    // A veces React necesita un "tick" del reloj para actualizar el objeto formData
    cy.wait(500); 

    // 5. CLICK EN EL BOTÓN "ACEPTAR"
    // Buscamos el botón específicamente y hacemos click forzado
    cy.get('button[type="submit"]').contains('Aceptar').click({ force: true });

    // 6. VERIFICACIÓN
    // Si sale el alert de "campos incompletos", el wait fallará.
    // Si todo va bien, esperará el mock.
    cy.wait('@subirArchivoMock', { timeout: 10000 });
    
    cy.get('@alert').should('have.been.calledWith', 'Archivo subido correctamente');
  });
});