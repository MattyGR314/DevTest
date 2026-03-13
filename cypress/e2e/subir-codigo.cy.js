/// <reference types="cypress" />

// Ignorar errores de la aplicación
Cypress.on('uncaught:exception', () => false);

describe('DT_03 - Publicar proyecto en la plataforma', () => {
  beforeEach(() => {
    // Visitar la página del formulario
    cy.visit('http://localhost:3000/subircodigo');
    
    // Esperar a que cargue el formulario
    cy.get('form#uploadCode').should('be.visible');
    
    // Mock del alert para verificarlo
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alert');
    });
  });

  // DT_03_1: Verificar que el formulario tiene nombre, archivo y correo
  it('DT_03_1: El formulario debe contener nombre, archivo y correo', () => {
    cy.get('input#nombre').should('be.visible');
    cy.get('input#correo').should('be.visible');
    cy.get('input#archivo').should('be.visible');
    cy.get('input#archivo').should('have.attr', 'accept', '.exe, .bat');
    cy.contains('button', 'Aceptar').should('be.visible');
    cy.contains('button', 'Cancelar').should('be.visible');
  });

  // DT_03_2: Registro exitoso
  it('DT_03_2: Registro exitoso con todos los campos válidos', () => {
    // Mock de respuesta exitosa
    cy.intercept('POST', '/subircodigo', {
      statusCode: 200,
      body: { message: 'Archivo subido correctamente' }
    }).as('registroExitoso');

    // Llenar formulario con datos válidos
    cy.get('input#nombre').type('Mi Proyecto Valido');
    cy.get('input#correo').type('developer@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    // Enviar formulario
    cy.contains('button', 'Aceptar').click();
    
    // Verificar que se llamó al backend
    cy.wait('@registroExitoso').its('response.statusCode').should('eq', 200);
    
    // Verificar alerta de éxito
    cy.get('@alert').should('have.been.calledWith', 'Archivo subido correctamente');
    
    // Verificar que el formulario se reseteó
    cy.get('input#nombre').should('have.value', '');
    cy.get('input#correo').should('have.value', '');
  });

  // DT_03_3: Nombre con caracteres especiales
  it('DT_03_3: Rechazar nombre con caracteres especiales', () => {
    const nombresInvalidos = [
      'Mi@Proyecto',
      'Proyecto#123',
      'Nombre$pecial'
    ];

    nombresInvalidos.forEach((nombreInvalido) => {
      cy.get('input#nombre').clear().type(nombreInvalido);
      cy.get('input#correo').clear().type('developer@email.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
      
      cy.contains('button', 'Aceptar').click();
      
      cy.get('@alert').should('have.been.calledWith', 'El nombre no puede contener caracteres especiales');
    });
  });

  // DT_03_4: Archivo no ejecutable
  it('DT_03_4: Rechazar archivo no ejecutable', () => {
    const archivosInvalidos = [
      'cypress/fixtures/documento.txt',
      'cypress/fixtures/imagen.jpg'
    ];

    archivosInvalidos.forEach((archivoInvalido) => {
      cy.get('input#nombre').clear().type('Mi Proyecto');
      cy.get('input#correo').clear().type('developer@email.com');
      cy.get('input#archivo').selectFile(archivoInvalido, { force: true });
      
      cy.contains('button', 'Aceptar').click();
      
      cy.get('@alert').should('have.been.calledWith', 'El código subido no es un fichero ejecutable');
    });
  });

  // DT_03_5: Campos vacíos
  it('DT_03_5: Rechazar formulario con campos vacíos', () => {
    // Caso: Todos los campos vacíos
    cy.contains('button', 'Aceptar').click();
    cy.get('@alert').should('have.been.calledWith', 'Todos los campos han de estar completos');
  });

  // DT_03_6: Nombre de proyecto ya existe
  it('DT_03_6: Rechazar cuando el nombre ya existe en el sistema', () => {
    // Mock de conflicto (409)
    cy.intercept('POST', '/subircodigo', {
      statusCode: 409,
      body: { error: 'Ya existe un proyecto con este nombre' }
    }).as('conflictoNombre');

    cy.get('input#nombre').type('Proyecto Existente');
    cy.get('input#correo').type('developer@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    cy.contains('button', 'Aceptar').click();
    
    cy.wait('@conflictoNombre').its('response.statusCode').should('eq', 409);
    cy.get('@alert').should('have.been.calledWith', 'Ya existe un proyecto con este nombre');
  });

  // Validación de formato de correo
  it('DT_03_2: Validar que el correo siga los estándares', () => {
    // Mock GLOBAL para TODAS las peticiones de esta prueba
    cy.intercept('POST', '/subircodigo', (req) => {
      req.reply({
        statusCode: 200,
        body: { message: 'Archivo subido correctamente' }
      });
    }).as('subirArchivo');
    
    // Correos válidos
    const correosValidos = [
      'test@email.com',
      'usuario.nombre@dominio.es',
      'correo+etiqueta@gmail.com'
    ];

    correosValidos.forEach((correo) => {
      const nombreUnico = `Proyecto ${Date.now()} ${Math.random()}`;
      
      cy.get('input#nombre').clear().type(nombreUnico);
      cy.get('input#correo').clear().type(correo);
      cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
      
      cy.contains('button', 'Aceptar').click();
      
      cy.wait('@subirArchivo');
      
      cy.get('@alert').should('not.have.been.calledWith', 'El correo no sigue los estándares establecidos');
      cy.get('@alert').should('have.been.calledWith', 'Archivo subido correctamente');
      
      cy.get('@alert').reset();
      cy.reload();
      cy.get('form#uploadCode').should('be.visible');
    });

    // Correos inválidos
    const correosInvalidos = [
      'correo@',
      '@email.com',
      'correo@.com',
      'correo@dominio',
      'correo email.com'
    ];

    correosInvalidos.forEach((correo) => {
      const nombreUnico = `Proyecto ${Date.now()} ${Math.random()}`;
      
      cy.get('input#nombre').clear().type(nombreUnico);
      cy.get('input#correo').clear().type(correo);
      cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
      
      cy.contains('button', 'Aceptar').click();
      
      cy.get('@alert').should('have.been.calledWith', 'El correo no sigue los estándares establecidos');
      
      cy.get('@alert').reset();
      cy.reload();
      cy.get('form#uploadCode').should('be.visible');
    });
  });

  // Prueba simple de envío exitoso
  it('debería enviar el formulario con éxito (mock)', () => {
    // Mock específico para esta prueba
    cy.intercept('POST', '/subircodigo', {
      statusCode: 200,
      body: { message: 'Archivo subido correctamente' }
    }).as('subirArchivoMock');

    // Incluir TODOS los campos
    cy.get('input#nombre').clear().type('Proyecto Test');
    cy.get('input#correo').type('test@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    cy.contains('button', 'Aceptar').click();
    
    cy.wait('@subirArchivoMock');
    cy.get('@alert').should('have.been.calledWith', 'Archivo subido correctamente');
  });
});