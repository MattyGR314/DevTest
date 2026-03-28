/// <reference types="cypress" />

describe('DT_02 - Inicio de sesion en la plataforma', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3000/iniciarSesion');
		cy.contains('h2', 'Iniciar Sesión').should('be.visible');
	});

	it('DT_02_1: El usuario debe rellenar un formulario con correo y contrasena', () => {
		cy.get('form').should('be.visible');
		cy.get('input#correo').should('be.visible').and('have.attr', 'type', 'email');
		cy.get('input#contrasena').should('be.visible').and('have.attr', 'type', 'password');
		cy.contains('button', 'Iniciar Sesión').should('be.visible');
	});

	it('DT_02_2: Si correo y contrasena son correctos, se inicia sesion', () => {
		cy.intercept('POST', '/api/login', {
			statusCode: 200,
			body: { correo: 'tester@devtest.com' }
		}).as('loginExitoso');

		cy.get('input#correo').type('tester@devtest.com');
		cy.get('input#contrasena').type('Password123');
		cy.contains('button', 'Iniciar Sesión').click();

		cy.wait('@loginExitoso');
		cy.url().should('eq', 'http://localhost:3000/');
		cy.window().then((win) => {
			expect(win.localStorage.getItem('usuario_correo')).to.equal('tester@devtest.com');
		});
	});

	it('DT_02_3: Si el correo no esta registrado, no se inicia sesion y se pide otro correo', () => {
		cy.intercept('POST', '/api/login', {
			statusCode: 404,
			body: { error: 'Usuario no registrado' }
		}).as('loginCorreoNoRegistrado');

		cy.get('input#correo').type('noexiste@devtest.com');
		cy.get('input#contrasena').type('Password123');
		cy.contains('button', 'Iniciar Sesión').click();

		cy.wait('@loginCorreoNoRegistrado');
		cy.contains(/usuario no registrado/i).should('be.visible');
		cy.url().should('include', '/iniciarSesion');
	});

	it('DT_02_4: Si la contrasena no corresponde al correo, se pide otra contrasena', () => {
		cy.intercept('POST', '/api/login', {
			statusCode: 401,
			body: { error: 'Contraseña incorrecta' }
		}).as('loginContrasenaIncorrecta');

		cy.get('input#correo').type('tester@devtest.com');
		cy.get('input#contrasena').type('MalaPassword');
		cy.contains('button', 'Iniciar Sesión').click();

		cy.wait('@loginContrasenaIncorrecta');
		cy.contains(/contrasena incorrecta|contraseña incorrecta/i).should('be.visible');
		cy.url().should('include', '/iniciarSesion');
	});
});
