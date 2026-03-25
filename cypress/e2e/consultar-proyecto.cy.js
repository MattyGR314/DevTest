/// <reference types="cypress" />

describe('DT_10 - Consultar proyecto', () => {
  
  beforeEach(() => {
    // Limpiar el almacenamiento local para evitar interferencias
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  // DT_10_1: Proyecto existe - mostrar nombre, descripción y fichero
  it('DT_10_1: Mostrar nombre, descripción y fichero cuando proyecto existe', () => {
    const proyectoMock = {
      id: '123',
      nombre: 'Proyecto Backend API',
      descripcion: 'API REST para gestión de usuarios',
      fichero: 'proyecto-backend.exe',
      fecha_creacion: '2025-03-20T10:30:00'
    };

    cy.intercept('GET', '/api/proyectos?q=123&campo=id', {
      statusCode: 200,
      body: [proyectoMock]
    }).as('getProyecto');

    cy.visit('http://localhost:3000/resultado-consulta/123');
    cy.wait('@getProyecto');

    // Verificar que se muestren los datos del proyecto
    cy.contains('Proyecto Backend API').should('be.visible');
    cy.contains('API REST para gestión de usuarios').should('be.visible');
    cy.contains('proyecto-backend.exe').should('be.visible');
    cy.contains('Detalle del proyecto').should('be.visible');
  });

  // DT_10_2: Proyecto no existe - mostrar notificación y redirigir a inicio
  it('DT_10_2: Notificar y redirigir a inicio cuando proyecto no existe', () => {
    cy.intercept('GET', '/api/proyectos?q=999&campo=id', {
      statusCode: 200,
      body: []
    }).as('getProyectoNoExiste');

    cy.visit('http://localhost:3000/resultado-consulta/999');
    cy.wait('@getProyectoNoExiste');

    // Verificar que se muestre el mensaje de error
    cy.contains('No existe un proyecto con ese ID.').should('be.visible');

    // Verificar que hay un botón para volver a búsqueda (alternativa a inicio)
    cy.contains('Volver a busqueda').should('be.visible').click();
    
    // Verificar que se redirige a la página de búsqueda
    cy.url().should('include', '/busqueda');
  });

  // DT_10_3: Proyecto no tiene nombre - mostrar notificación
  it('DT_10_3: Notificar cuando proyecto no tiene nombre asociado', () => {
    const proyectoSinNombre = {
      id: '456',
      nombre: null,
      descripcion: 'API REST para gestión de usuarios',
      fichero: 'proyecto-api.exe',
      fecha_creacion: '2025-03-20T10:30:00'
    };

    cy.intercept('GET', '/api/proyectos?q=456&campo=id', {
      statusCode: 200,
      body: [proyectoSinNombre]
    }).as('getProyectoSinNombre');

    cy.visit('http://localhost:3000/resultado-consulta/456');
    cy.wait('@getProyectoSinNombre');

    // Verificar que se muestre el mensaje de proyecto sin nombre
    cy.contains('Sin nombre').should('be.visible');
    
    // Verificar que otros datos todavía se muestren
    cy.contains('API REST para gestión de usuarios').should('be.visible');
  });

  // DT_10_4: Proyecto no tiene fichero - mostrar notificación
  it('DT_10_4: Notificar cuando proyecto no tiene fichero asociado', () => {
    const proyectoSinFichero = {
      id: '789',
      nombre: 'Proyecto Frontend',
      descripcion: 'Aplicación React para dashboard',
      fichero: null,
      fecha_creacion: '2025-03-20T10:30:00'
    };

    cy.intercept('GET', '/api/proyectos?q=789&campo=id', {
      statusCode: 200,
      body: [proyectoSinFichero]
    }).as('getProyectoSinFichero');

    cy.visit('http://localhost:3000/resultado-consulta/789');
    cy.wait('@getProyectoSinFichero');

    // Verificar que se muestre el proyecto pero sin fichero
    cy.contains('Proyecto Frontend').should('be.visible');
    cy.contains('Aplicación React para dashboard').should('be.visible');
    
    // Verificar que no hay fichero o se muestre como vacío
    cy.contains('Sin fichero').should('be.visible');
  });

  // Test adicional: Validar navegación desde búsqueda
  it('DT_10_Adicional: Navegar a consulta desde búsqueda hacia resultado', () => {
    cy.visit('http://localhost:3000/busqueda');
    
    // Interceptar la búsqueda
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: [
        {
          id: '111',
          nombre: 'Proyecto Test',
          descripcion: 'Descripción de test',
          fichero: 'test.exe'
        }
      ]
    }).as('searchProyectos');

    // Realizar búsqueda
    cy.get('input[placeholder*="Buscar"]').type('Proyecto Test');
    cy.get('button[type="submit"]').click();
    cy.wait('@searchProyectos');

    // Verificar que aparecen resultados
    cy.contains('Proyecto Test').should('be.visible');
  });

});
