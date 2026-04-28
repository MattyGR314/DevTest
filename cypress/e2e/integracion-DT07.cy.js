/// <reference types="cypress" />

describe('Pruebas de Integración - DT07 Descarga de Ejecutable', () => {
  const PROYECTO_ID = 1;
  const USUARIO_TEST = 'tester@ucm.es';

  beforeEach(() => {
    cy.clearLocalStorage();
    
    // INTEGRACIÓN CAJA BLANCA: Definimos el objeto exacto que espera el componente
    // para validar la conexión con la unidad de Proyectos 
    cy.intercept('GET', `/api/proyectos/${PROYECTO_ID}`, {
      statusCode: 200,
      body: { 
        id: PROYECTO_ID, 
        nombre: 'Proyecto Delta',
        nombre_fichero: 'programa.exe',
        archivo_path: 'uploads/123-programa.exe',
        correo: 'creador@devtest.com',
        fecha_creacion: '2026-04-25'
      }
    }).as('getProyecto');
  });

  it('INT_DT07_01: Integración Exitosa (Top-Down) - Tester Inscrito', () => {
    // Unión con módulo Auth: El tipo debe estar en minúsculas para el componente 
    localStorage.setItem('usuario_correo', USUARIO_TEST);
    localStorage.setItem('usuario_tipo', 'tester');

    // Unión con módulo Inscripciones: Simulamos conexión positiva 
    cy.intercept('GET', `/api/inscripciones/check*`, {
      statusCode: 200,
      body: { inscrito: true }
    }).as('checkInscrito');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);
    cy.wait(['@getProyecto', '@checkInscrito']);

    // Verificamos que la unión de las 3 unidades permite la descarga 
    cy.get('a.btn-descarga')
      .should('be.visible')
      .and('have.attr', 'href', '/uploads/123-programa.exe');
  });

  it('INT_DT07_02: Integración Denegada (Caja Blanca) - Tester No Inscrito', () => {
    localStorage.setItem('usuario_correo', USUARIO_TEST);
    localStorage.setItem('usuario_tipo', 'tester');

    // La conexión con la unidad de inscripciones devuelve falso 
    cy.intercept('GET', `/api/inscripciones/check*`, {
      statusCode: 200,
      body: { inscrito: false }
    }).as('checkNoInscrito');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);
    cy.wait(['@getProyecto', '@checkNoInscrito']);

    // El componente debe integrar la respuesta y mostrar el botón de inscripción 
    cy.get('a.btn-descarga').should('not.exist');
    cy.contains('Inscribirse como Tester').should('be.visible');
  });

  it('INT_DT07_03: Manejo de Errores de Conexión entre Unidades', () => {
    // Simulamos que la conexión con la base de datos de proyectos falla 
    cy.intercept('GET', `/api/proyectos/${PROYECTO_ID}`, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' }
    }).as('errorConexion');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);
    cy.wait('@errorConexion');

    // Validamos que el componente captura el error de la unidad subordinada 
    cy.contains('Proyecto no encontrado').should('be.visible');
  });

  it('INT_DT07_04: Integración de Seguridad - Usuario Desarrollador', () => {
    // Si la unidad de Auth indica que es 'developer', no debe ver la descarga 
    localStorage.setItem('usuario_correo', 'dev@ucm.es');
    localStorage.setItem('usuario_tipo', 'developer');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);
    cy.wait('@getProyecto');

    // Según ResultadoConsulta.js, si no es tester, botonInscripcion() devuelve null 
    cy.get('a.btn-descarga').should('not.exist');
    cy.get('.btn-inscripcion').should('not.exist');
  });
});