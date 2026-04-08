/// <reference types="cypress" />

/**
 * SUITE DE PRUEBAS DE INTEGRACION
 * Flujo: Consultar Proyecto (DT_10)
 * Objetivo: Validar la navegacion desde busqueda a detalle y el manejo de estados
 * simulando respuestas del backend para asegurar estabilidad en CI.
 */

describe('INTEGRACION: DT_10 - Consultar proyecto', () => {

  beforeEach(() => {
    cy.intercept('GET', '/api/proyectos', {
      statusCode: 200,
      body: []
    }).as('cargaInicialProyectos');

    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('FLUJO DE INTEGRACION: Busqueda a detalle', () => {

    it('IT_CON_001 (DT_10_1): Buscar por nombre, habilitar detalles y visualizar proyecto', () => {
      const proyecto = {
        id: 111,
        nombre: 'Proyecto Integracion DT10',
        descripcion: 'Detalle de prueba para flujo integrado',
        correo: 'dt10@test.com',
        fichero: 'integracion.exe',
        fecha_creacion: '2026-03-20T10:30:00Z'
      };

      cy.intercept({
        method: 'GET',
        pathname: '/api/proyectos',
        query: {
          q: 'Proyecto Integracion DT10',
          campo: 'nombre'
        }
      }, {
        statusCode: 200,
        body: [proyecto]
      }).as('buscarPorNombre');

      cy.intercept({
        method: 'GET',
        pathname: '/api/proyectos',
        query: {
          q: '111',
          campo: 'id'
        }
      }, {
        statusCode: 200,
        body: [proyecto]
      }).as('consultarPorId');

      cy.visit('http://localhost:3000/busqueda');
      cy.wait('@cargaInicialProyectos');

      cy.get('select.busqueda-seleccionar').select('nombre');
      cy.get('input.busqueda-input').clear().type('Proyecto Integracion DT10');
      cy.get('button.busqueda-boton').click();
      cy.wait('@buscarPorNombre');

      cy.contains('a.proyecto-link', 'Proyecto Integracion DT10').should('be.visible').click();

      cy.wait('@consultarPorId');
      cy.url().should('include', '/resultado-consulta/111');
      cy.contains('Detalle del proyecto').should('be.visible');
      cy.contains('Proyecto Integracion DT10').should('be.visible');
      cy.contains('Detalle de prueba para flujo integrado').should('be.visible');
      cy.contains('integracion.exe').should('be.visible');
    });

  });

  describe('ESTADOS DE LA CONSULTA DE DETALLE', () => {

    it('IT_CON_002 (DT_10_2): Mostrar mensaje cuando no existe el proyecto', () => {
      cy.intercept('GET', '/api/proyectos?q=999&campo=id', {
        statusCode: 200,
        body: []
      }).as('proyectoNoExiste');

      cy.visit('http://localhost:3000/resultado-consulta/999');
      cy.wait('@proyectoNoExiste');

      // Notificacion de no encontrado (DT_10_2)
      cy.contains('.resultado-error', 'No existe un proyecto con ese ID.').should('be.visible');

      // En la implementacion actual el regreso es por accion de usuario
      // hacia la pantalla de inicio funcional del flujo (busqueda)
      cy.contains('a', 'Volver a busqueda').should('be.visible').click();
      cy.url().should('include', '/busqueda');
    });

    it('IT_CON_003 (DT_10_3): Notificar ausencia de nombre asociado', () => {
      cy.intercept('GET', '/api/proyectos?q=456&campo=id', {
        statusCode: 200,
        body: [{
          id: 456,
          nombre: null,
          descripcion: 'Servicio sin nombre para pruebas',
          fichero: 'servicio.exe',
          fecha_creacion: '2026-03-21T12:00:00Z'
        }]
      }).as('proyectoSinNombre');

      cy.visit('http://localhost:3000/resultado-consulta/456');
      cy.wait('@proyectoSinNombre');

      cy.contains('Detalle del proyecto').should('be.visible');
      cy.contains('Sin nombre').should('be.visible');
      cy.contains('Servicio sin nombre para pruebas').should('be.visible');
      cy.contains('servicio.exe').should('be.visible');
    });

    it('IT_CON_004 (DT_10_4): Notificar ausencia de fichero asociado', () => {
      cy.intercept('GET', '/api/proyectos?q=789&campo=id', {
        statusCode: 200,
        body: [{
          id: 789,
          nombre: 'Proyecto sin fichero',
          descripcion: 'Proyecto con metadatos pero sin binario',
          fichero: null,
          fecha_creacion: '2026-03-21T15:10:00Z'
        }]
      }).as('proyectoSinFichero');

      cy.visit('http://localhost:3000/resultado-consulta/789');
      cy.wait('@proyectoSinFichero');

      cy.contains('Detalle del proyecto').should('be.visible');
      cy.contains('Proyecto sin fichero').should('be.visible');
      cy.contains('Proyecto con metadatos pero sin binario').should('be.visible');
      cy.contains('Sin fichero').should('be.visible');
    });

    it('IT_CON_005: Mostrar estado de carga antes de renderizar detalle', () => {
      cy.intercept('GET', '/api/proyectos?q=222&campo=id', {
        delay: 1200,
        statusCode: 200,
        body: [{
          id: 222,
          nombre: 'Proyecto con latencia',
          descripcion: 'Se usa para validar estado de carga',
          fichero: 'latencia.exe',
          fecha_creacion: '2026-03-22T08:00:00Z'
        }]
      }).as('detalleLento');

      cy.visit('http://localhost:3000/resultado-consulta/222');

      cy.contains('.resultado-info', 'Cargando proyecto...').should('be.visible');
      cy.wait('@detalleLento');
      cy.contains('.resultado-info', 'Cargando proyecto...').should('not.exist');
      cy.contains('Proyecto con latencia').should('be.visible');
    });

    it('IT_CON_006: Manejar error de backend en consulta por ID', () => {
      cy.intercept('GET', '/api/proyectos?q=500&campo=id', {
        statusCode: 500,
        body: { error: 'Error interno' }
      }).as('errorDetalle');

      cy.visit('http://localhost:3000/resultado-consulta/500');
      cy.wait('@errorDetalle');

      cy.contains('.resultado-error', 'No se pudo obtener el proyecto').should('be.visible');
      cy.get('.resultado-card').should('not.exist');
    });

  });

});