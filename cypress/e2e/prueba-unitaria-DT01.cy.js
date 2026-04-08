/// <reference types="cypress" />

describe('DT_01 - Registro de usuario', () => {
	beforeEach(() => {
		cy.visit('/registro');
	});

	it('DT_01_1: Muestra los campos y botones obligatorios', () => {
		cy.contains('h2', 'Crear cuenta').should('be.visible');
		cy.get('input#correo').should('be.visible').and('have.attr', 'type', 'email');
		cy.get('input#contrasena').should('be.visible').and('have.attr', 'type', 'password');
		cy.get('input#confirmarContrasena').should('be.visible').and('have.attr', 'type', 'password');
		cy.contains('button', 'Registrarse').should('be.visible');
		cy.contains('button', 'Cancelar').should('be.visible');
	});

	it('DT_01_2: Valida campos obligatorios y evita enviar al backend', () => {
		cy.intercept('POST', '/api/registro').as('postRegistro');

		cy.contains('button', 'Registrarse').click();

		cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');
		cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');
		cy.contains('[role="alert"]', 'Debes confirmar la contraseña').should('be.visible');
		cy.get('@postRegistro.all').should('have.length', 0);
	});

	it('DT_01_3: Rechaza correo con formato inválido', () => {
		cy.get('input#correo').type('correo-invalido');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('123456');

		cy.contains('button', 'Registrarse').click();
		cy.contains('[role="alert"]', 'El correo no tiene un formato válido').should('be.visible');
	});

	it('DT_01_4: Rechaza cuando las contraseñas no coinciden', () => {
		cy.get('input#correo').type('usuario@test.com');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('abcdef');

		cy.contains('button', 'Registrarse').click();
		cy.contains('[role="alert"]', 'Las contraseñas no coinciden').should('be.visible');
	});

	it('DT_01_5: Limpia el error de un campo cuando el usuario lo corrige', () => {
		cy.contains('button', 'Registrarse').click();
		cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');

		cy.get('input#correo').type('valido@test.com');
		cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('not.exist');
	});

	it('DT_01_6: El botón cancelar limpia los datos y los errores', () => {
		cy.contains('button', 'Registrarse').click();
		cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');

		cy.get('input#correo').type('reset@test.com');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('123456');

		cy.contains('button', 'Cancelar').click();

		cy.get('input#correo').should('have.value', '');
		cy.get('input#contrasena').should('have.value', '');
		cy.get('input#confirmarContrasena').should('have.value', '');
		cy.get('[role="alert"]').should('not.exist');
	});

	it('DT_01_7: Registro exitoso muestra alerta y redirige al inicio de sesión', () => {
		cy.window().then((win) => {
			cy.stub(win, 'alert').as('alert');
		});

		cy.intercept('POST', '/api/registro', (req) => {
			expect(req.body).to.deep.equal({
				correo: 'nuevo@test.com',
				contrasena: '123456'
			});

			req.reply({
				delay: 500,
				statusCode: 201,
				body: { message: 'Usuario registrado correctamente' }
			});
		}).as('postRegistroExito');

		cy.get('input#correo').type('nuevo@test.com');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('123456');

		cy.contains('button', 'Registrarse').click();

		cy.contains('button', 'Registrando...').should('be.disabled');
		cy.wait('@postRegistroExito');
		cy.get('@alert').should('have.been.calledWith', 'Usuario registrado correctamente. Ya puedes iniciar sesión.');
		cy.location('pathname').should('eq', '/iniciarsesion');
	});

	it('DT_01_8: Muestra error de correo duplicado cuando backend responde 409', () => {
		cy.intercept('POST', '/api/registro', {
			statusCode: 409,
			body: { error: 'Ya existe un usuario con ese correo' }
		}).as('postRegistro409');

		cy.get('input#correo').type('existente@test.com');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('123456');

		cy.contains('button', 'Registrarse').click();

		cy.wait('@postRegistro409');
		cy.contains('[role="alert"]', 'Ya existe un usuario con ese correo').should('be.visible');
	});

	it('DT_01_9: Muestra error del servidor para respuestas no controladas', () => {
		cy.intercept('POST', '/api/registro', {
			statusCode: 500,
			body: { error: 'Error interno inesperado' }
		}).as('postRegistro500');

		cy.get('input#correo').type('usuario500@test.com');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('123456');

		cy.contains('button', 'Registrarse').click();

		cy.wait('@postRegistro500');
		cy.contains('[role="alert"]', 'Error interno inesperado').should('be.visible');
	});

	it('DT_01_10: Muestra error de conexión cuando falla la petición', () => {
		cy.intercept('POST', '/api/registro', {
			forceNetworkError: true
		}).as('postRegistroRed');

		cy.get('input#correo').type('red@test.com');
		cy.get('input#contrasena').type('123456');
		cy.get('input#confirmarContrasena').type('123456');

		cy.contains('button', 'Registrarse').click();

		cy.wait('@postRegistroRed');
		cy.contains('[role="alert"]', 'Error de conexión con el servidor').should('be.visible');
	});
});
