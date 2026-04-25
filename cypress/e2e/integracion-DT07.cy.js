/// <reference types="cypress" />

describe('Pruebas de Integración - DT07 Descarga de Ejecutable', () => {
  const PROYECTO_ID = 1;
  const USUARIO_TEST = 'tester@ucm.es';

  before(() => {
    // Estrategia Bottom-Up: Preparar la base de datos real para validar conexiones [cite: 20, 32]
    cy.exec('node infra/seed_dt07.js');
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    // Interceptores para validación de interfaces entre módulos (Caja Blanca) 
    cy.intercept('GET', `/api/proyectos/${PROYECTO_ID}`).as('getProyecto');
    cy.intercept('GET', `/api/inscripciones/check?correo=${USUARIO_TEST}&id_proyectos=${PROYECTO_ID}`).as('checkInscrito');
  });

  it('INT_DT07_01: Integración Exitosa (Bottom-Up) - Usuario Inscrito con Acceso al Fichero', () => {
    // Simulación de sesión activa (Módulo Auth)
    window.localStorage.setItem('usuario_correo', USUARIO_TEST);

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);

    // Validar conexión real entre Componente -> API Proyectos 
    cy.wait('@getProyecto').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body).to.have.property('archivo_path');
    });

    // Validar conexión real entre Componente -> API Inscripciones 
    cy.wait('@checkInscrito').its('response.statusCode').should('eq', 200);

    // Verificación de la unión de módulos: El enlace de descarga debe ser funcional
    cy.contains(/descargar/i)
      .should('be.visible')
      .and('have.attr', 'href')
      .and('include', '/uploads/');
  });

  it('INT_DT07_02: Integración Denegada (Top-Down) - Usuario No Inscrito (Uso de Stubs)', () => {
    // Estrategia Top-Down: Sustituir el módulo de inscripciones por un stub para aislar la lógica 
    cy.intercept('GET', `/api/inscripciones/check?*`, {
      statusCode: 200,
      body: { inscrito: false }
    }).as('stubNoInscrito');

    window.localStorage.setItem('usuario_correo', USUARIO_TEST);
    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);

    cy.wait('@stubNoInscrito');

    // Validación de la conexión: El sistema debe ocultar la descarga si el módulo de inscripción retorna falso
    cy.get('a[href*="/uploads/"]').should('not.exist');
    cy.contains(/inscribirse para descargar/i).should('be.visible');
  });

  it('INT_DT07_03: Manejo de Errores en la Conexión (Caja Blanca) - Fallo de Servidor', () => {
    // Simular fallo en la conexión real con el módulo de datos [cite: 21]
    cy.intercept('GET', `/api/proyectos/${PROYECTO_ID}`, {
      statusCode: 500,
      body: { error: 'Error de base de datos' }
    }).as('apiError');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);

    cy.wait('@apiError');
    
    // Verificar que la integración maneja el fallo de la unidad subordinada sin romperse
    cy.contains(/error al cargar el proyecto/i).should('be.visible');
    cy.get('.btn-descarga').should('not.exist');
  });

  it('INT_DT07_04: Integración de Seguridad - Sin Sesión Activa', () => {
    // Al no haber datos en el módulo de Auth, la conexión debe denegar la descarga
    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);

    cy.get('a[href*="/uploads/"]').should('not.exist');
    cy.contains(/inicia sesión para participar/i).should('be.visible');
  });
});