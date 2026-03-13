// cypress/support/commands.js

// Comando para llenar el formulario de subida
Cypress.Commands.add('llenarFormularioSubida', (nombreProyecto, archivoPath) => {
  cy.get('input#nombre').clear().type(nombreProyecto);
  
  if (archivoPath) {
    cy.get('input#archivo').selectFile(archivoPath, { force: true });
  }
});

// Comando para verificar que el formulario está vacío
Cypress.Commands.add('verificarFormularioVacio', () => {
  cy.get('input#nombre').should('have.value', '');
  cy.get('input#archivo').then(($input) => {
    expect($input[0].files.length).to.equal(0);
  });
});

// Comando para interceptar peticiones al backend
Cypress.Commands.add('interceptarSubida', (respuestaMock) => {
  cy.intercept('POST', '/subircodigo', respuestaMock).as('subirArchivo');
});

// Comando para esperar y verificar alertas
Cypress.Commands.add('verificarAlerta', (mensajeEsperado) => {
  cy.on('window:alert', (mensaje) => {
    expect(mensaje).to.include(mensajeEsperado);
  });
});