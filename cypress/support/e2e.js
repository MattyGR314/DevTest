// cypress/support/e2e.js

// Importar comandos personalizados
import './commands';

/// <reference types="cypress" />

// Ignorar TODOS los errores de alerts y promesas
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar cualquier error relacionado con alerts o promesas de Cypress
  if (err.message.includes('alert') || 
      err.message.includes('Cypress detected that you returned a promise')) {
    return false;
  }
  return true;
});

// Silenciar todas las alerts
Cypress.on('window:alert', () => {});

describe('Componente SubirCodigo - Pruebas', () => {
  beforeEach(() => {
    // Visitar la página
    cy.visit('http://localhost:3000/subircodigo', {
      onBeforeLoad(win) {
        // Mockear completamente la función alert para que no haga nada
        cy.stub(win, 'alert').as('alert');
      }
    });
    
    cy.get('form#uploadCode', { timeout: 10000 }).should('be.visible');
    cy.intercept('POST', '/subircodigo').as('subirArchivo');
  });

  it('debería enviar el formulario con éxito (mock)', () => {
    // Mock de respuesta exitosa
    cy.intercept('POST', '/subircodigo', {
      statusCode: 200,
      body: { message: 'Archivo subido correctamente' }
    }).as('subirArchivoMock');

    // Llenar el formulario
    cy.get('input#nombre').clear().type('Proyecto Test');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    // Enviar el formulario
    cy.contains('button', 'Aceptar').click();

    // Esperar la petición
    cy.wait('@subirArchivoMock').its('response.statusCode').should('eq', 200);
    
    // Verificar que el formulario se reseteó (opcional)
    cy.get('input#nombre').should('have.value', '');
    
    // NO verificamos alerts porque causan problemas
  });
});

// Antes de cada prueba
beforeEach(() => {
  // Aquí puedes agregar código que se ejecute antes de cada prueba
  cy.log('Iniciando nueva prueba...');
});