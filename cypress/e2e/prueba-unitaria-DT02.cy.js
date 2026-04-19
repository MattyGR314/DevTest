/// <reference types="cypress" />

describe('DT_02 - Inicio de sesion en la plataforma', () => {
	beforeEach(() => {
		cy.clearLocalStorage();
		cy.visit('/iniciarSesion');
		cy.get('form').should('be.visible');
	});

	it('DT_02_1: El usuario debe rellenar un formulario con correo y contrasena', () => {
		cy.get('input#correo').should('be.visible').and('have.attr', 'type', 'email');
		cy.get('input#contrasena').should('be.visible').and('have.attr', 'type', 'password');
		cy.contains('button', 'Iniciar Sesión').should('be.visible');
		cy.contains('button', 'Cancelar').should('be.visible');
	});

	it('DT_02_2: Si correo y contrasena son correctos, se inicia sesion', () => {
		cy.intercept('POST', '/api/login', {
			statusCode: 200,
			body: { correo: 'tester@devtest.com' },
			delay: 300
		}).as('loginExitoso');

		cy.get('input#correo').type('tester@devtest.com');
		cy.get('input#contrasena').type('Password123');
		cy.contains('button', 'Iniciar Sesión').click();

		cy.contains('button', 'Comprobando...').should('be.disabled');
		cy.contains('button', 'Cancelar').should('be.disabled');

		cy.wait('@loginExitoso').then(({ request }) => {
			expect(request.body).to.deep.equal({
				correo: 'tester@devtest.com',
				contrasena: 'Password123'
			});
		});

		cy.location('pathname').should('eq', '/');
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
		cy.location('pathname').should('eq', '/iniciarSesion');
		cy.window().then((win) => {
			expect(win.localStorage.getItem('usuario_correo')).to.be.null;
		});
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
		cy.location('pathname').should('eq', '/iniciarSesion');
	});

	it('DT_02_5: Correo invalido en frontend bloquea la peticion de login', () => {
		cy.intercept('POST', '/api/login').as('loginNoDebeSalir');

		cy.get('input#correo').type('correo-invalido');
		cy.get('input#contrasena').type('Password123');
		cy.contains('button', 'Iniciar Sesión').click();

		cy.contains(/formato válido|formato valido/i).should('be.visible');
		cy.get('@loginNoDebeSalir.all').should('have.length', 0);
		cy.location('pathname').should('eq', '/iniciarSesion');
	});

	it('DT_02_6: Formulario vacio muestra errores requeridos y no hace POST', () => {
		cy.intercept('POST', '/api/login').as('loginVacio');

		cy.contains('button', 'Iniciar Sesión').click();

		cy.contains(/correo electrónico es obligatorio|correo electronico es obligatorio/i).should('be.visible');
		cy.contains(/contraseña es obligatoria|contrasena es obligatoria/i).should('be.visible');
		cy.get('@loginVacio.all').should('have.length', 0);
	});

	it('DT_02_7: Error de red muestra mensaje y mantiene al usuario en login', () => {
		cy.intercept('POST', '/api/login', { forceNetworkError: true }).as('falloRed');

		cy.get('input#correo').type('tester@devtest.com');
		cy.get('input#contrasena').type('Password123');
		cy.contains('button', 'Iniciar Sesión').click();

		cy.wait('@falloRed');
		cy.contains(/error de conexión con el servidor|error de conexion con el servidor/i).should('be.visible');
		cy.location('pathname').should('eq', '/iniciarSesion');
	});

	it('DT_02_8: Si ya existe sesion activa, el formulario queda deshabilitado', () => {
		cy.window().then((win) => {
			win.localStorage.setItem('usuario_correo', 'logueado@devtest.com');
		});

		cy.visit('/iniciarSesion');

		cy.contains(/ya has iniciado sesión como/i).should('be.visible');
		cy.get('input#correo').should('be.disabled');
		cy.get('input#contrasena').should('be.disabled');
		cy.contains('button', 'Iniciar Sesión').should('be.disabled');
	});

	it('DT_02_9: El boton cancelar redirige al inicio', () => {
		cy.get('input#correo').type('test@devtest.com');
		cy.get('input#contrasena').type('1234');

		cy.contains('button', 'Cancelar').click();

		cy.location('pathname').should('eq', '/');
	});
});
