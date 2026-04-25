/// <reference types="cypress" />

describe('Pruebas de Integración - DT07 Descarga de Ejecutable', () => {
  const PROYECTO_ID = 1;
  const USUARIO_CORREO = 'tester@ucm.es';

  beforeEach(() => {
    cy.clearLocalStorage();
    
    // INTEGRACIÓN CAJA BLANCA: Forzamos el cuerpo de respuesta (body) en los intercepts 
    // para asegurar que la "conexión entre unidades" reciba JSON y no HTML.
    cy.intercept('GET', `/api/proyectos/${PROYECTO_ID}`, {
      statusCode: 200,
      body: { 
        id: PROYECTO_ID, 
        nombre: 'Proyecto Delta', 
        archivo_path: 'uploads/ejecutable_test.exe' 
      }
    }).as('getProyecto');
  });

  it('INT_DT07_01: Integración Exitosa (Top-Down) - Conexión de Datos y Descarga', () => {
    // Simulamos la unión con el módulo de Autenticación
    window.localStorage.setItem('usuario_correo', USUARIO_CORREO);

    // Stub de la unidad de Inscripciones para validar la lógica de grupo 
    cy.intercept('GET', `/api/inscripciones/check*`, {
      statusCode: 200,
      body: { inscrito: true }
    }).as('checkInscrito');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);

    // Validamos que la unión de unidades (Proyecto + Inscripción) permite la descarga
    cy.wait(['@getProyecto', '@checkInscrito']);
    
    // Verificamos el atributo href como prueba de caja blanca de la URL generada
    cy.get('a[href*="uploads"]').should('be.visible').and('have.attr', 'download');
  });

  it('INT_DT07_02: Integración Denegada (Caja Blanca) - Usuario No Inscrito', () => {
    window.localStorage.setItem('usuario_correo', USUARIO_CORREO);

    // Forzamos respuesta negativa del módulo subordinado (Inscripciones) 
    cy.intercept('GET', `/api/inscripciones/check*`, {
      statusCode: 200,
      body: { inscrito: false }
    }).as('checkNoInscrito');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);
    cy.wait(['@getProyecto', '@checkNoInscrito']);

    // La integración debe ocultar el botón y mostrar el mensaje de acción requerida
    cy.get('a[href*="uploads"]').should('not.exist');
    cy.contains(/inscribirse|participar/i).should('be.visible');
  });

  it('INT_DT07_03: Manejo de Errores de Conexión (Fallo de Unidad)', () => {
    // Simulamos un fallo en la conexión con la base de datos (Error 500) 
    cy.intercept('GET', `/api/proyectos/${PROYECTO_ID}`, {
      statusCode: 500,
      body: { error: 'Error interno de conexión' }
    }).as('errorConexion');

    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);
    cy.wait('@errorConexion');

    // Validamos que el sistema maneja la ruptura de la conexión correctamente
    cy.contains(/error|no se pudo/i).should('be.visible');
  });

  it('INT_DT07_04: Integración de Seguridad - Sesión Inactiva', () => {
    // Al no haber datos en LocalStorage, la conexión con AuthContext debe fallar
    cy.visit(`/resultado-consulta/${PROYECTO_ID}`);

    // Verificamos que el sistema solicita inicio de sesión para interactuar
    cy.get('a[href*="uploads"]').should('not.exist');
    cy.contains(/inicia sesión/i).should('be.visible');
  });
});