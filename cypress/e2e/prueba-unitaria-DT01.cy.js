/// <reference types="cypress" />

describe('DT_01 - Registro de usuario', () => {
	beforeEach(() => {
		cy.visit('/registro');
	});

/* funcion de ayuda*/
const completarFormulario = (correo, contrasena, confirmarContrasena, tipoCuenta = 'developer') => {
    cy.get('input#correo').clear().type(correo);
    cy.get('input#contrasena').clear().type(contrasena);
    cy.get('input#confirmarContrasena').clear().type(confirmarContrasena);
    cy.get('select#tipoCuenta').select(tipoCuenta);
  };

	/*modificado DT 01 05*/
    it('DT_01_1: Muestra los campos y botones obligatorios, incluyendo tipo de cuenta', () => {
        cy.contains('h2', 'Crear cuenta').should('be.visible');
        cy.get('input#correo').should('be.visible').and('have.attr', 'type', 'email');
		cy.get('input#contrasena').should('be.visible').and('have.attr', 'type', 'password');
		cy.get('input#confirmarContrasena').should('be.visible').and('have.attr', 'type', 'password');
		cy.get('select#tipoCuenta').should('be.visible');
		cy.get('select#tipoCuenta option').should('have.length', 2);
		cy.get('select#tipoCuenta').should('contain', 'Developer').and('contain', 'Tester');
		cy.contains('button', 'Crear cuenta').should('be.visible');
		cy.contains('button', 'Limpiar').should('be.visible');
    });
	/*modificado DT 01 05*/

	it('DT_01_2: Valida campos obligatorios y evita enviar al backend', () => {
		cy.intercept('POST', '/api/registro').as('postRegistro');

		cy.contains('button', 'Crear cuenta').click();

		cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');
		cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');
		cy.contains('[role="alert"]', 'Debes confirmar la contraseña').should('be.visible');
		cy.get('@postRegistro.all').should('have.length', 0);
	});

	it('DT_01_3: Rechaza correo con formato inválido', () => {
		completarFormulario('correo-invalido', '12345678', '12345678', 'developer'); //modificado DT 01 05

		cy.contains('button', 'Crear cuenta').click(); //modificado DT 01 05
		cy.contains('[role="alert"]', 'El correo no tiene un formato válido').should('be.visible');
	});

	it('DT_01_4: Rechaza cuando las contraseñas no coinciden', () => {
		completarFormulario('usuario@test.com', '12345678', 'abcdefgh', 'developer'); //modificado DT 01 05

		cy.contains('button', 'Crear cuenta').click(); //modificado DT 01 05
		cy.contains('[role="alert"]', 'Las contraseñas no coinciden').should('be.visible');
	});

	it('DT_01_5: Limpia el error de un campo cuando el usuario lo corrige', () => {
		cy.contains('button', 'Crear cuenta').click();
		cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');

		cy.get('input#correo').type('valido@test.com');
		cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('not.exist');
	});

	it('DT_01_6: El botón cancelar limpia los datos y los errores', () => {
		cy.contains('button', 'Crear cuenta').click();
		cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');

		completarFormulario('reset@test.com', '12345678', '12345678', 'tester'); //modificado DT 01 05

		cy.contains('button', 'Limpiar').click(); //modificado DT 01 05

		cy.get('input#correo').should('have.value', '');
		cy.get('input#contrasena').should('have.value', '');
		cy.get('input#confirmarContrasena').should('have.value', '');
		cy.get('select#tipoCuenta').should('have.value', 'developer'); // valor por defecto
		cy.get('[role="alert"]').should('not.exist');
	});

	it('DT_01_7: Registro exitoso muestra mensaje de éxito y redirige al inicio', () => {
		cy.intercept('POST', '/api/registro', (req) => {
			expect(req.body).to.deep.equal({
			correo: 'nuevo@test.com',
			contrasena: '12345678',
			tipoCuenta: 'tester'
			});
			req.reply({
			delay: 500,
			statusCode: 201,
			body: { message: 'Usuario registrado correctamente' }
			});
		}).as('postRegistroExito');

		completarFormulario('nuevo@test.com', '12345678', '12345678', 'tester');
		cy.contains('button', 'Crear cuenta').click();

		cy.contains('button', 'Registrando...').should('be.disabled');
		cy.wait('@postRegistroExito');

		cy.contains('¡Cuenta creada!').should('be.visible');
		cy.contains('Redirigiendo a inicio...').should('be.visible');

		cy.location('pathname', { timeout: 4000 }).should('eq', '/');
	});

	it('DT_01_8: Muestra error de correo duplicado cuando backend responde 409', () => {
		cy.intercept('POST', '/api/registro', {
			statusCode: 409,
			body: { error: 'Ya existe un usuario con ese correo' }
		}).as('postRegistro409');

		completarFormulario('existente@test.com', '12345678', '12345678', 'developer'); //modificado DT 01 05

		cy.contains('button', 'Crear cuenta').click(); //modificado DT 01 05

		cy.wait('@postRegistro409');
		cy.contains('[role="alert"]', 'Ya existe un usuario con ese correo').should('be.visible');
	});

	it('DT_01_9: Muestra error del servidor para respuestas no controladas', () => {
		cy.intercept('POST', '/api/registro', {
			statusCode: 500,
			body: { error: 'Error interno inesperado' }
		}).as('postRegistro500');

		completarFormulario('usuario500@test.com', '12345678', '12345678', 'developer'); //modificado DT 01 05

		cy.contains('button', 'Crear cuenta').click(); //modificado DT 01 05

		cy.wait('@postRegistro500');
		cy.contains('[role="alert"]', 'Error interno inesperado').should('be.visible');
	});

	it('DT_01_10: Muestra error de conexión cuando falla la petición', () => {
		cy.intercept('POST', '/api/registro', {
			forceNetworkError: true
		}).as('postRegistroRed');

		completarFormulario('red@test.com', '12345678', '12345678', 'developer'); //modificado DT 01 05

		cy.contains('button', 'Crear cuenta').click(); //modificado DT 01 05

		cy.wait('@postRegistroRed');
		cy.contains('[role="alert"]', 'Error de conexión con el servidor').should('be.visible');
	});

	// === NUEVAS PRUEBAS AÑADIDAS EN SPRINT 2 ===
    // DT_01_5_extra: Contraseña menor a 8 caracteres
	it('DT_01_5_longitud: Rechaza contraseña con menos de 8 caracteres', () => {
		completarFormulario('corto@test.com', '1234567', '1234567', 'developer');
		cy.contains('button', 'Crear cuenta').click();
		cy.contains('[role="alert"]', 'La contraseña debe tener al menos 8 caracteres').should('be.visible');
	});

	// DT_01_5_extra: Contraseña con espacios
	it('DT_01_5_espacios: Rechaza contraseña que contiene espacios', () => {
		completarFormulario('espacios@test.com', '12 345678', '12 345678', 'developer');
		cy.contains('button', 'Crear cuenta').click();
		cy.contains('[role="alert"]', 'La contraseña no puede contener espacios').should('be.visible');
	});
});


