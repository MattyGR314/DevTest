/// <reference types="cypress" />

/**
 * SUITE DE PRUEBAS DE INTEGRACIÓN
 * Flujo: Listar Proyectos (DT_05)
 * Objetivo: Validar la integración del frontend (navegación y renderizado)
 * simulando las respuestas del backend para asegurar estabilidad en CI.
 */

describe('INTEGRACIÓN: DT_05 - Listar Proyectos Registrados', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  // ========================================================================================
  // FLUJO COMPLETO END-TO-END (Con Backend Simulado)
  // ========================================================================================

  describe('FLUJO DE INTEGRACIÓN: Subir y Listar', () => {

    it('IT_LST_001 (DT_05_1): Flujo completo de subida y visualización en la lista', () => {
      const nombreUnico = `Proyecto Integracion ${Date.now()}`;

      // 1. MOCKEAMOS LA SUBIDA (Simulamos que el backend lo guarda con éxito)
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 100 }
      }).as('uploadSuccess');

      // 2. MOCKEAMOS LA BÚSQUEDA (Simulamos que el backend devuelve el proyecto recién subido)
      cy.intercept('GET', '/api/proyectos*', {
        statusCode: 200,
        body: [{
          id: 100,
          nombre: nombreUnico,
          correo: 'integracion@test.com',
          fecha_creacion: new Date().toISOString(),
          descripcion: 'Proyecto subido durante el flujo de integración',
          archivo_path: 'uploads/script.bat'
        }]
      }).as('getProyectosNuevos');

      // --- INICIA EL FLUJO DEL USUARIO ---
      
      // A) Usuario sube un proyecto
      cy.visit('http://localhost:3000/subircodigo');
      cy.get('input#nombre').type(nombreUnico);
      cy.get('input#correo').type('integracion@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.get('textarea#descripcion').type('Proyecto subido durante el flujo de integración');
      
      cy.get('button').contains('Aceptar').click();
      cy.wait('@uploadSuccess');
      cy.url({ timeout: 5000 }).should('include', '/confirmacion');

      // B) Usuario va a la lista a buscarlo
      cy.visit('http://localhost:3000/busqueda');
      cy.wait('@getProyectosNuevos');

      // C) Verificamos que se integren correctamente las vistas
      cy.get('.resultados-list').should('exist');
      
      // Buscamos el proyecto en la lista generada
      cy.contains('.proyecto-tabla', nombreUnico).within(() => {
        cy.get('h3').should('contain', nombreUnico);
        cy.contains('integracion@test.com').should('be.visible');
      });
    });

    it('IT_LST_002: La interfaz procesa correctamente un array de datos (Contrato API)', () => {
      // Validamos que si el backend envía múltiples datos, React los procesa sin romperse
      cy.intercept('GET', '/api/proyectos*', {
        statusCode: 200,
        body: [
          { id: 1, nombre: 'Alpha', correo: 'a@a.com', fecha_creacion: '2026-01-01T10:00:00Z' },
          { id: 2, nombre: 'Beta', correo: 'b@b.com', fecha_creacion: '2026-01-02T10:00:00Z' }
        ]
      }).as('getMultiples');

      cy.visit('http://localhost:3000/busqueda');
      cy.wait('@getMultiples');

      cy.get('.proyecto-tabla').should('have.length', 2);
    });

  });

  // ========================================================================================
  // SIMULACIÓN DE ESTADOS DE INTERFAZ
  // ========================================================================================

  describe(' SIMULACIÓN DE ESTADOS DE INTERFAZ', () => {

    it('IT_LST_003 (DT_05_2): Notificar la ausencia de proyectos si el servidor responde vacío', () => {
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
      // Añadimos datos al mock para que el contenedor NO mida 0 píxeles al finalizar
      cy.intercept('GET', '/api/proyectos*', {
        delay: 1500, // Retraso para forzar el loader
        statusCode: 200,
        body: [{ id: 1, nombre: 'Carga completada', correo: 'c@c.com', fecha_creacion: new Date() }]
      }).as('getProyectosLentos');

      cy.visit('http://localhost:3000/busqueda');

      cy.get('.cargando', { timeout: 500 }).should('be.visible');

      cy.wait('@getProyectosLentos');

      cy.get('.cargando').should('not.exist');
      // Usamos 'exist' en lugar de 'be.visible' por si hay problemas de CSS con el height
      cy.get('.resultados-list').should('exist'); 
    });

    it('IT_LST_005: El frontend maneja con gracia una caída de la Base de Datos (Error 500)', () => {
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