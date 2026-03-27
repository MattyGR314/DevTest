/// <reference types="cypress" />

describe('DT_03 - Publicar proyecto en la plataforma', () => {
  
  beforeEach(() => {
    // Limpieza de estado para evitar interferencias
    cy.visit('http://localhost:3000/subircodigo');
    
    // Esperar a que el formulario esté listo (ya no interceptamos window.alert)
    cy.get('form#uploadCode').should('be.visible');
  });

  // DT_03_1: El formulario debe contener nombre, archivo y correo
  it('DT_03_1: Verificar existencia de campos requeridos', () => {
    cy.get('input#nombre').should('be.visible');
    cy.get('input#correo').should('be.visible');
    cy.get('input#archivo').should('be.visible').and('have.attr', 'accept', '.exe, .bat');
    cy.contains('button', 'Aceptar').should('be.visible');
  });

  // DT_03_2: Registro exitoso con todos los campos válidos
  it('DT_03_2: Registro exitoso con campos válidos y correo estándar', () => {
    cy.intercept('POST', '/subircodigo', {
      statusCode: 200,
      body: { message: 'Archivo subido correctamente' }
    }).as('postExito');

    cy.get('input#nombre').type('Proyecto Final');
    cy.get('input#correo').type('developer@test.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    // Esperar confirmación visual de que React cargó el archivo
    cy.contains('Archivo seleccionado: programa.exe', { timeout: 10000 }).should('be.visible');

    cy.contains('button', 'Aceptar').click();
    
    cy.wait('@postExito');
    
    // El frontend redirige inmediatamente, por lo que validamos la URL
    cy.url().should('include', '/confirmacion');
  });

  // DT_03_3: Rechazar nombre con caracteres especiales
  it('DT_03_3: Rechazar nombre con caracteres especiales', () => {
    cy.get('input#nombre').type('Proyecto_@Mal!');
    cy.get('input#correo').type('test@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    cy.contains('button', 'Aceptar').click();
    
    // Validamos el mensaje de error específico debajo del input
    cy.get('.error-message').should('contain', 'El nombre no puede contener caracteres especiales');
  });

  // DT_03_4: Rechazar archivo no ejecutable
  it('DT_03_4: Rechazar archivo no ejecutable', () => {
    cy.get('input#nombre').type('Nombre Valido');
    cy.get('input#correo').type('test@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/documento.txt', { force: true });
    
    cy.contains('button', 'Aceptar').click();
    
    // Texto corregido para coincidir exactamente con SubirCodigo.js
    cy.get('.error-message').should('contain', 'El archivo debe ser ejecutable (.exe o .bat)');
  });

  // DT_03_5: Rechazar formulario con campos vacíos
  it('DT_03_5: Rechazar cuando faltan campos', () => {
    // Intentar enviar sin llenar nada
    cy.contains('button', 'Aceptar').click();
    
    // Texto corregido: "deben estar completos" en lugar de "han de estar completos"
    cy.get('.mensaje-global').should('contain', 'Todos los campos deben estar completos');
  });

  // DT_03_6: Rechazar cuando el nombre ya existe
  it('DT_03_6: Rechazar nombre duplicado (Error 409)', () => {
    cy.intercept('POST', '/subircodigo', {
      statusCode: 409,
      body: { error: 'Ya existe un proyecto con este nombre' }
    }).as('postConflicto');

    cy.get('input#nombre').type('Nombre Repetido');
    cy.get('input#correo').type('test@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    cy.contains('button', 'Aceptar').click();
    cy.wait('@postConflicto');
    
    // El frontend muestra los errores de base de datos en el mensaje global superior
    cy.get('.mensaje-global').should('contain', 'Ya existe un proyecto con este nombre');
  });

  // Prueba adicional: Validar que el correo no siga estándares
  it('DT_03_2_Extra: Validar estándares de correo electrónico', () => {
    cy.get('input#nombre').type('Proyecto Test');
    cy.get('input#correo').type('correo-sin-punto@dominio');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    cy.contains('button', 'Aceptar').click();
    
    cy.get('.error-message').should('contain', 'El correo no sigue los estándares establecidos');
  });
});