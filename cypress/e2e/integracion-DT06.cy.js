/// <reference types="cypress" />

describe('DT_06 - Integración: Inscripción de tester en proyecto', () => {
	const proyectoId = 1;

	beforeEach(() => {
		cy.visit(`http://localhost:3000/seleccionarproyecto/${proyectoId}`);
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
				cy.contains(/correo no es válido|correo no existe/i).should('be.visible');
				cy.url().should('eq', Cypress.config().baseUrl + '/');
			}
		});
	});

	it('DT_06_02: Si el correo no está registrado, notifica error y redirige a inicio', () => {
		cy.get('input#nombre').type('Tester Integración');
		cy.get('input#correo').type('falso.no.registrado@empresa.com');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/correo no existe/i).should('be.visible');
		cy.url().should('eq', Cypress.config().baseUrl + '/');
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
		cy.get('input#nombre').type('Tester Integración');
		cy.get('input#correo').type('tester_valido@ejemplo.com');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/inscripcion guardada exitosamente|guardada exitosamente/i).should('be.visible');
	});
});