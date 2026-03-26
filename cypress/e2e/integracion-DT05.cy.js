/// <reference types="cypress" />

/**
 * SUITE DE PRUEBAS DE INTEGRACIÓN
 * Flujo: Listar Proyectos (DT_05)
 * * Objetivo: Validar la integración REAL entre el frontend (React), 
 * el backend (Express en app.js) y la base de datos (MySQL).
 */

describe('INTEGRACIÓN: DT_05 - Listar Proyectos Registrados', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  // ========================================================================================
  // PRUEBAS DE INTEGRACIÓN REAL (Backend + Frontend + Base de Datos)
  // ========================================================================================

  describe('🔗 INTEGRACIÓN REAL END-TO-END (Sin Mocks)', () => {

    it('IT_LST_001 (DT_05_1): Subir un proyecto y verificar que aparece en la lista real', () => {
      // Usamos un timestamp para generar un nombre único en la base de datos real
      const nombreUnico = `Proyecto Real ${Date.now()}`;

      // 1. PASO PREVIO: Subimos un proyecto real usando el flujo de DT_03
      cy.visit('http://localhost:3000/subircodigo');
      cy.get('input#nombre').type(nombreUnico);
      cy.get('input#correo').type('integracion@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.get('textarea#descripcion').type('Este proyecto fue inyectado por una prueba de integración real.');
      
      // Enviamos el formulario al BACKEND REAL
      cy.get('button').contains('Aceptar').click();
      cy.url({ timeout: 10000 }).should('include', '/confirmacion');

      // 2. LA PRUEBA EN SÍ: Navegamos a la vista de búsqueda (DT_05)
      cy.visit('http://localhost:3000/busqueda');

      // Interceptamos la llamada real solo para saber cuándo termina, NO para mockearla
      cy.intercept('GET', '/api/proyectos*').as('getProyectosReales');
      cy.wait('@getProyectosReales');

      // 3. VALIDACIONES: Verificamos que el proyecto que acabamos de subir está en la BD y se pinta
      cy.get('.resultados-list').should('be.visible');
      cy.get('.proyecto-tabla').should('have.length.at.least', 1); // Al menos 1 (el que subimos)
      
      // Buscamos específicamente el proyecto que acabamos de crear en la lista
      cy.contains('.proyecto-tabla', nombreUnico).within(() => {
        cy.get('h3').should('contain', nombreUnico);
        cy.contains('integracion@test.com').should('be.visible');
        cy.contains('Este proyecto fue inyectado por una prueba').should('be.visible');
        // Validar que el botón de descarga del archivo real existe
        cy.get('a.descarga-link').should('have.attr', 'href').and('include', '/uploads/');
      });
    });

    it('IT_LST_002: La API devuelve correctamente un código 200 y un array de datos', () => {
      // En lugar de usar la interfaz, le preguntamos directamente al backend real
      cy.request('GET', 'http://localhost:3000/api/proyectos').then((response) => {
        // Verificamos el contrato de comunicación (Frontend <-> Backend)
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        // Como el test anterior insertó un proyecto, el array no debe estar vacío
        expect(response.body.length).to.be.greaterThan(0); 
        
        // Verificamos que la estructura del JSON es la que espera React
        const primerProyecto = response.body[0];
        expect(primerProyecto).to.have.property('id');
        expect(primerProyecto).to.have.property('nombre');
        expect(primerProyecto).to.have.property('correo');
      });
    });

  });

  // ========================================================================================
  // SIMULACIÓN DE ESTADOS (Con Mocks para forzar escenarios específicos)
  // ========================================================================================

  describe('🎭 SIMULACIÓN DE ESTADOS DE INTERFAZ', () => {

    // NOTA: Usamos un mock aquí porque vaciar la base de datos real en cada prueba 
    // requeriría un endpoint "DELETE /api/proyectos" que aún no tienes en app.js.
    it('IT_LST_003 (DT_05_2): Notificar la ausencia de proyectos si el servidor responde vacío', () => {
      
      // Bloqueamos la respuesta de MySQL y forzamos un array vacío
      cy.intercept('GET', '/api/proyectos*', {
        statusCode: 200,
        body: [] 
      }).as('getProyectosVacios');

      cy.visit('http://localhost:3000/busqueda');
      cy.wait('@getProyectosVacios');

      cy.get('.proyecto-tabla').should('not.exist');
      
      cy.get('.no-resultados')
        .should('be.visible')
        .and('contain.text', 'No se encontraron proyectos');
    });

    it('IT_LST_004: Mostrar y ocultar estado de carga durante la latencia de red', () => {
      // Forzamos un retraso de 1.5 segundos en la API para simular una red lenta
      cy.intercept('GET', '/api/proyectos*', (req) => {
        req.on('response', (res) => {
          res.setDelay(1500);
        });
      }).as('getProyectosLentos');

      cy.visit('http://localhost:3000/busqueda');

      // Validar que el frontend reacciona mostrando el loader
      cy.get('.cargando', { timeout: 500 }).should('be.visible');

      cy.wait('@getProyectosLentos');

      // Validar que el frontend se recupera cuando llegan los datos
      cy.get('.cargando').should('not.exist');
      cy.get('.resultados-list').should('be.visible');
    });

    it('IT_LST_005: El frontend maneja con gracia una caída de la Base de Datos (Error 500)', () => {
      // Simulamos que el pool.getConnection() falló en app.js
      cy.intercept('GET', '/api/proyectos*', {
        statusCode: 500,
        body: { error: 'Error al obtener proyectos', detalles: 'Connection lost' }
      }).as('getErrorDb');

      cy.visit('http://localhost:3000/busqueda');
      cy.wait('@getErrorDb');

      cy.get('.error-mensaje')
        .should('be.visible')
        .and('contain.text', 'Error al cargar proyectos');

      cy.get('.proyecto-tabla').should('not.exist');
    });

  });

});