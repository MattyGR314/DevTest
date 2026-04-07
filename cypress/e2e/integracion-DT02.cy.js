/// <reference types="cypress" />

describe('INTEGRACION: DT_02 - Inicio de sesion', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('http://localhost:3000/iniciarSesion');
    cy.contains('h2', 'Iniciar Sesión').should('be.visible');
    cy.get('form').should('be.visible');
  });

  it('IT_001: Renderiza el formulario completo con campos requeridos', () => {
    cy.get('input#correo').should('be.visible').and('have.attr', 'type', 'email');
    cy.get('input#contrasena').should('be.visible').and('have.attr', 'type', 'password');
    cy.contains('button', 'Iniciar Sesión').should('be.visible');
    cy.contains('button', 'Cancelar').should('be.visible');
    cy.contains('Campos obligatorios').should('be.visible');
  });

  it('IT_002: Inicio de sesion exitoso con redireccion y persistencia en localStorage', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { correo: 'tester@devtest.com' },
      delay: 400
    }).as('loginOk');

    cy.get('input#correo').type('tester@devtest.com');
    cy.get('input#contrasena').type('Password123');

    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains('button', 'Comprobando...').should('be.disabled');
    cy.contains('button', 'Cancelar').should('be.disabled');

    cy.wait('@loginOk').then(({ request }) => {
      expect(request.body).to.deep.equal({
        correo: 'tester@devtest.com',
        contrasena: 'Password123'
      });
    });

    cy.url().should('eq', 'http://localhost:3000/');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('usuario_correo')).to.equal('tester@devtest.com');
    });
  });

  it('IT_003: Correo no registrado muestra error y no redirige', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 404,
      body: { error: 'Usuario no registrado' }
    }).as('correoNoExiste');

    cy.get('input#correo').type('noexiste@devtest.com');
    cy.get('input#contrasena').type('Password123');
    cy.contains('button', 'Iniciar Sesión').click();

    cy.wait('@correoNoExiste');
    cy.contains(/usuario no registrado/i).should('be.visible');
    cy.url().should('include', '/iniciarSesion');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('usuario_correo')).to.be.null;
    });
  });

  it('IT_004: Contrasena incorrecta muestra error y no redirige', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 401,
      body: { error: 'Contraseña incorrecta' }
    }).as('contrasenaIncorrecta');

    cy.get('input#correo').type('tester@devtest.com');
    cy.get('input#contrasena').type('MalaPassword');
    cy.contains('button', 'Iniciar Sesión').click();

    cy.wait('@contrasenaIncorrecta');
    cy.contains(/contrasena incorrecta|contraseña incorrecta/i).should('be.visible');
    cy.url().should('include', '/iniciarSesion');
  });

  it('IT_005: Correo invalido en frontend bloquea la peticion al backend', () => {
    cy.intercept('POST', '/api/login').as('loginNoDebeSalir');

    cy.get('input#correo').type('correo-invalido');
    cy.get('input#contrasena').type('Password123');
    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains(/formato válido|formato valido/i).should('be.visible');
    cy.get('@loginNoDebeSalir.all').should('have.length', 0);
    cy.url().should('include', '/iniciarSesion');
  });

  it('IT_006: Formulario vacio muestra errores requeridos y no hace POST', () => {
    cy.intercept('POST', '/api/login').as('loginVacio');

    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains(/correo electrónico es obligatorio|correo electronico es obligatorio/i).should('be.visible');
    cy.contains(/contraseña es obligatoria|contrasena es obligatoria/i).should('be.visible');
    cy.get('@loginVacio.all').should('have.length', 0);
    cy.url().should('include', '/iniciarSesion');
  });

  it('IT_007: Error de red muestra mensaje de conexion y mantiene al usuario en login', () => {
    cy.intercept('POST', '/api/login', { forceNetworkError: true }).as('falloRed');

    cy.get('input#correo').type('tester@devtest.com');
    cy.get('input#contrasena').type('Password123');
    cy.contains('button', 'Iniciar Sesión').click();

    cy.wait('@falloRed');
    cy.contains(/error de conexión con el servidor|error de conexion con el servidor/i).should('be.visible');
    cy.url().should('include', '/iniciarSesion');
  });

  it('IT_008: Boton cancelar limpia datos y errores del formulario', () => {
    cy.contains('button', 'Iniciar Sesión').click();
    cy.contains(/correo electrónico es obligatorio|correo electronico es obligatorio/i).should('be.visible');

    cy.get('input#correo').type('test@devtest.com');
    cy.get('input#contrasena').type('1234');
    cy.contains('button', 'Cancelar').click();

    cy.get('input#correo').should('have.value', '');
    cy.get('input#contrasena').should('have.value', '');
    cy.get('.error-message').should('not.exist');
  });
});
