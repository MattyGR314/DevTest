/// <reference types="cypress" />

describe('DT_06 - Integración: Inscripción de tester en proyecto', () => {
	const proyectoId = 1;

	beforeEach(() => {
		cy.intercept('GET', `/api/proyectos/${proyectoId}`, {
			statusCode: 200,
			body: {
				id: proyectoId,
				nombre: 'Proyecto DT06',
				correo: 'owner@test.com',
				archivo_path: 'uploads/script.bat',
				fecha_creacion: '2026-04-01T10:00:00Z'
			}
		}).as('proyectoDetalle');

		cy.visit(`http://localhost:3000/seleccionarproyecto/${proyectoId}`);
		cy.wait('@proyectoDetalle');
	});

	it('DT_06_01: Al seleccionar proyecto se muestra formulario con nombre y correo', () => {
		cy.get('form#inscripcion').should('be.visible');
		cy.get('input#nombre').should('be.visible');
		cy.get('input#correo').should('be.visible');
		cy.contains('button', 'Inscribirse').should('be.visible');
	});

	it('DT_06_02: Si el correo tiene formato inválido, notifica error y redirige a inicio', () => {
		cy.get('input#nombre').type('Tester Integración');
		cy.get('input#correo').type('correo_invalido'); 
		cy.contains('button', 'Inscribirse').click();

		cy.get('input#correo').then(($input) => {
			if ($input[0].validationMessage) {
				expect($input[0].checkValidity()).to.be.false;
			} else {
				cy.contains(/correo no es válido/i).should('be.visible');
				cy.url().should('eq', Cypress.config().baseUrl + '/');
			}
		});
	});

	it('DT_06_02: Si el correo es válido aunque no esté registrado, registra al tester en el proyecto', () => {
		cy.intercept('POST', '/api/inscripciones', {
			statusCode: 201,
			body: {
				message: 'Inscripción guardada exitosamente',
				id: 124,
				nombre: 'Tester Integración',
				correo: 'falso.no.registrado@empresa.com',
				id_proyectos: proyectoId
			}
		}).as('inscripcionCorreoNoRegistrado');

		cy.get('input#nombre').type('Tester Integración');
		cy.get('input#correo').type('falso.no.registrado@empresa.com');
		cy.contains('button', 'Inscribirse').click();
		cy.wait('@inscripcionCorreoNoRegistrado');

		cy.contains(/inscripcion guardada exitosamente|guardada exitosamente/i).should('be.visible');
		cy.url().should('include', '/seleccionarproyecto/');
	});

	it('DT_06_03: Si el nombre está vacío, notifica inválido y redirige a inicio', () => {
		cy.get('input#correo').type('tester_valido@ejemplo.com');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/nombre no es válido|obligatorio/i).should('be.visible');
		cy.url().should('eq', Cypress.config().baseUrl + '/');
	});

	it('DT_06_03: Si el nombre tiene menos de 2 caracteres, notifica inválido y redirige a inicio', () => {
		cy.get('input#nombre').type('A');
		cy.get('input#correo').type('tester_valido@ejemplo.com');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/nombre no es válido|al menos/i).should('be.visible');
		cy.url().should('eq', Cypress.config().baseUrl + '/');
	});

	it('DT_06_04: Si el correo es válido, registra al tester en el proyecto', () => {
		cy.intercept('POST', '/api/inscripciones', {
			statusCode: 201,
			body: {
				message: 'Inscripción guardada exitosamente',
				id: 123,
				nombre: 'Tester Integración',
				correo: 'tester_valido@ejemplo.com',
				id_proyectos: proyectoId
			}
		}).as('inscripcionExitosa');

		cy.get('input#nombre').type('Tester Integración');
		cy.get('input#correo').type('tester_valido@ejemplo.com');
		cy.contains('button', 'Inscribirse').click();
		cy.wait('@inscripcionExitosa');

		cy.contains(/inscripcion guardada exitosamente|guardada exitosamente/i).should('be.visible');
	});
});