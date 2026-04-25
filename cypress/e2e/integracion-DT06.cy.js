/* global cy */
describe('Pruebas de Integración - DT06 Seleccionar Proyecto', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('INT_01: Integración con AuthContext (Top-Down)', () => {
    window.localStorage.setItem('usuario_correo', 'tester@ucm.es');
    window.localStorage.setItem('usuario_tipo', 'developer');

    cy.visit('/seleccionarproyecto/1');

    cy.get('input[name="correo"]').should('be.disabled');
    cy.get('input[name="correo"]').should('have.value', 'tester@ucm.es');
  });

  it('INT_02: Integración Frontend, API y Base de Datos (Bottom-Up)', () => {
    // 1. Inyectar usuario en BD real
    cy.request({
      method: 'POST',
      url: '/api/registro',
      body: { correo: 'nuevo_tester@ucm.es', contrasena: '1234', tipoCuenta: 'developer' },
      failOnStatusCode: false
    });

    // 2. Crear un proyecto dinámicamente asegurando la validación del frontend
    cy.visit('/subircodigo');
    cy.get('input[name="nombre"]').type('Proyecto Integracion DT06');
    cy.get('input[name="correo"]').type('nuevo_tester@ucm.es');
    
    // CORRECCIÓN: Usamos un archivo .exe para pasar la validación esEjecutable()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/programa.exe');
    
    cy.intercept('POST', '/subircodigo').as('peticionSubida');
    cy.get('button[type="submit"]').click();

    cy.wait('@peticionSubida').then((interception) => {
      const bodyRespuesta = JSON.stringify(interception.response.body);
      // Esta aserción fallará intencionalmente si el código no es 200-300, 
      // imprimiendo el motivo real del rechazo en el log de Actions
      expect(
        interception.response.statusCode, 
        `Motivo de rechazo del backend: ${bodyRespuesta}`
      ).to.eq(200);
    });
    
    // Esperar a que la redirección confirme la inserción en BD
    cy.url().should('include', '/confirmacion');

    // 3. Obtener el ID real generado y ejecutar la inscripción
    cy.request('/api/proyectos').then((res) => {
      // Buscamos específicamente el proyecto que acabamos de crear
      const proyectoCreado = res.body.find(p => p.nombre === 'Proyecto Integracion DT06');
      const idProyectoReal = proyectoCreado.id;

      cy.intercept('POST', '/api/inscripciones').as('postInscripcion');
      cy.visit(`/seleccionarproyecto/${idProyectoReal}`);

      cy.get('input[name="nombre"]').type('Estudiante UCM');
      cy.get('input[name="correo"]').type('nuevo_tester@ucm.es');
      cy.get('button[type="submit"]').click();

      // Validar conexión exitosa con el backend (Código 201)
      cy.wait('@postInscripcion').its('response.statusCode').should('eq', 201);

      // Validar persistencia en LocalStorage
      cy.window().then((win) => {
        const inscripciones = JSON.parse(win.localStorage.getItem('mis_inscripciones') || '{}');
        expect(inscripciones['nuevo_tester@ucm.es']).to.include(idProyectoReal);
      });
    });
  });

  it('INT_03: Manejo de errores de conexión y duplicados', () => {
    cy.intercept('POST', '/api/inscripciones', {
      statusCode: 409,
      body: { error: 'Ya estás inscrito en este proyecto' }
    }).as('postDuplicado');

    cy.visit('/seleccionarproyecto/1');

    cy.get('input[name="nombre"]').type('Estudiante UCM');
    cy.get('input[name="correo"]').type('duplicado@ucm.es');
    cy.get('button[type="submit"]').click();

    cy.wait('@postDuplicado');

    cy.contains('Ya estás inscrito en este proyecto').should('be.visible');
  });
});