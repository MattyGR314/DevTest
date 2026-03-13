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
    
    // Mock del fetch para pruebas
    cy.intercept('POST', '/subircodigo').as('subirArchivo');
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
      body: { message: 'Proyecto registrado' }
    }).as('registroExitoso');

    // Llenar formulario con datos válidos (INCLUYENDO CORREO)
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
      'Nombre$pecial',
      'Proyecto%',
      'Mi&Proyecto'
    ];

    nombresInvalidos.forEach((nombreInvalido) => {
      // Llenar formulario con nombre inválido
      cy.get('input#nombre').clear().type(nombreInvalido);
      cy.get('input#correo').clear().type('developer@email.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
      
      // Enviar formulario
      cy.contains('button', 'Aceptar').click();
      
      // Verificar alerta de error
      cy.get('@alert').should('have.been.calledWith', 'El nombre no puede contener caracteres especiales');
      
      // Recargar para limpiar el estado entre iteraciones
      cy.reload();
    });
  });

  // DT_03_4: Archivo no ejecutable
  it('DT_03_4: Rechazar archivo no ejecutable', () => {
    const archivosInvalidos = [
      'cypress/fixtures/documento.txt',
      'cypress/fixtures/imagen.jpg'
    ];

    archivosInvalidos.forEach((archivoInvalido) => {
      // Llenar formulario con archivo inválido
      cy.get('input#nombre').clear().type('Mi Proyecto');
      cy.get('input#correo').clear().type('developer@email.com');
      cy.get('input#archivo').selectFile(archivoInvalido, { force: true });
      
      // Enviar formulario
      cy.contains('button', 'Aceptar').click();
      
      // Verificar alerta de error
      cy.get('@alert').should('have.been.calledWith', 'El código subido no es un fichero ejecutable');
      
      // Recargar para limpiar el estado entre iteraciones
      cy.reload();
    });
  });

  // DT_03_5: Campos vacíos
  it('DT_03_5: Rechazar formulario con campos vacíos', () => {
    // Caso 1: Todos los campos vacíos
    cy.contains('button', 'Aceptar').click();
    cy.get('@alert').should('have.been.calledWith', 'Todos los campos han de estar completos');
    
    // Resetear stub y recargar
    cy.get('@alert').resetHistory();
    cy.reload();

    // Caso 2: Solo nombre vacío
    cy.get('input#nombre').clear();
    cy.get('input#correo').type('developer@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    cy.contains('button', 'Aceptar').click();
    cy.get('@alert').should('have.been.calledWith', 'Todos los campos han de estar completos');
    
    // Resetear stub y recargar
    cy.get('@alert').resetHistory();
    cy.reload();

    // Caso 3: Solo correo vacío
    cy.get('input#nombre').type('Mi Proyecto');
    cy.get('input#correo').clear();
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    cy.contains('button', 'Aceptar').click();
    cy.get('@alert').should('have.been.calledWith', 'Todos los campos han de estar completos');
    
    // Resetear stub y recargar
    cy.get('@alert').resetHistory();
    cy.reload();

    // Caso 4: Solo archivo vacío
    cy.get('input#nombre').type('Mi Proyecto');
    cy.get('input#correo').type('developer@email.com');
    cy.get('input#archivo').then($input => {
      // No seleccionar archivo
    });
    cy.contains('button', 'Aceptar').click();
    cy.get('@alert').should('have.been.calledWith', 'Todos los campos han de estar completos');
  });

  // DT_03_6: Nombre de proyecto ya existe
  it('DT_03_6: Rechazar cuando el nombre ya existe en el sistema', () => {
    // Mock de conflicto (409)
    cy.intercept('POST', '/subircodigo', {
      statusCode: 409,
      body: { error: 'El nombre del proyecto ya existe' }
    }).as('conflictoNombre');

    // Llenar formulario con datos válidos
    cy.get('input#nombre').type('Proyecto Existente');
    cy.get('input#correo').type('developer@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
    
    // Enviar formulario
    cy.contains('button', 'Aceptar').click();
    
    // Verificar que se llamó al backend
    cy.wait('@conflictoNombre').its('response.statusCode').should('eq', 409);
    
    // Verificar alerta de error
    cy.get('@alert').should('have.been.calledWith', 'Ya existe un proyecto con este nombre');
    
    // Verificar que el formulario NO se reseteó
    cy.get('input#nombre').should('have.value', 'Proyecto Existente');
    cy.get('input#correo').should('have.value', 'developer@email.com');
  });

  // Validación de formato de correo
  it('DT_03_2: Validar que el correo siga los estándares', () => {
    // Correos válidos
    const correosValidos = [
      'test@email.com',
      'usuario.nombre@dominio.es',
      'correo+etiqueta@gmail.com'
    ];

    correosValidos.forEach((correo) => {
      cy.get('input#nombre').clear().type('Mi Proyecto');
      cy.get('input#correo').clear().type(correo);
      cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
      cy.contains('button', 'Aceptar').click();
      
      // No debería mostrar error de correo
      cy.get('@alert').should('not.have.been.calledWith', 'El correo no sigue los estándares establecidos');
      
      // Resetear stub y recargar
      cy.get('@alert').resetHistory();
      cy.reload();
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
      cy.get('input#nombre').clear().type('Mi Proyecto');
      cy.get('input#correo').clear().type(correo);
      cy.get('input#archivo').selectFile('cypress/fixtures/programa.exe', { force: true });
      cy.contains('button', 'Aceptar').click();
      
      // Debería mostrar error de correo
      cy.get('@alert').should('have.been.calledWith', 'El correo no sigue los estándares establecidos');
      
      // Resetear stub y recargar
      cy.get('@alert').resetHistory();
      cy.reload();
    });
  });

  // Flujo completo exitoso
  it('Flujo completo: Todos los criterios correctos', () => {
    cy.intercept('POST', '/subircodigo', {
      statusCode: 200,
      body: { message: 'OK' }
    }).as('upload');

    cy.get('input#nombre').type('Proyecto Demo');
    cy.get('input#correo').type('demo@email.com');
    cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
    cy.contains('button', 'Aceptar').click();

    cy.wait('@upload');
    cy.get('@alert').should('have.been.calledWith', 'Archivo subido correctamente');
  });
});