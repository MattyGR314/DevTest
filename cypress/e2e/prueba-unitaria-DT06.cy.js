/// <reference types="cypress" />

describe('DT_06 - Inscripcion de tester en proyecto', () => {
	const proyectoId = 1;

	beforeEach(() => {
		cy.intercept('GET', `/api/proyectos/${proyectoId}`, {
			statusCode: 200,
			body: {
				id: proyectoId,
				nombre: 'Proyecto QA',
				correo: 'owner@empresa.com',
				archivo_path: 'uploads/proyecto.exe'
			}
		}).as('getProyecto');

		cy.visit(`http://localhost:3000/seleccionarproyecto/${proyectoId}`);
		cy.wait('@getProyecto');
		cy.get('form#inscripcion').should('be.visible');
	});

	it('DT_06_01: Al seleccionar proyecto se muestra formulario con nombre y correo', () => {
		cy.get('input#nombre').should('be.visible');
		cy.get('input#correo').should('be.visible');
		cy.contains('button', 'Inscribirse').should('be.visible');
	});

	it('DT_06_02: Si el correo no contiene "@" se notifica error', () => {
		cy.intercept('POST', '/api/inscripciones').as('postInscripcionNoEnviado');

		cy.get('input#nombre').type('Carlos');
		cy.get('input#correo').type('carlostest.com');
		cy.contains('button', 'Inscribirse').click();

		cy.get('input#correo').then(($input) => {
			expect($input[0].checkValidity()).to.equal(false);
			expect($input[0].validationMessage).to.not.equal('');
		});

		cy.get('@postInscripcionNoEnviado.all').should('have.length', 0);
	});

	it('DT_06_02: Si el correo no tiene dominio valido (sin punto) se notifica error', () => {
		cy.get('input#nombre').type('Carlos');
		cy.get('input#correo').type('carlos@test');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/El correo no es válido/i).should('be.visible');
	});

	it('DT_06_02: Si el correo contiene espacios en blanco se notifica error', () => {
		cy.intercept('POST', '/api/inscripciones').as('postInscripcionNoEnviado');

		cy.get('input#nombre').type('Carlos');
		cy.get('input#correo')
			.invoke('val', 'car los@test.com')
			.trigger('input')
			.trigger('change');
		cy.contains('button', 'Inscribirse').click();

		cy.get('input#correo').then(($input) => {
			expect($input[0].checkValidity()).to.equal(false);
			expect($input[0].validationMessage).to.not.equal('');
		});

		cy.get('@postInscripcionNoEnviado.all').should('have.length', 0);
	});

	it('DT_06_02: Si el correo no esta registrado se notifica error', () => {
		cy.intercept('POST', '/api/inscripciones', {
			statusCode: 404,
			body: { error: 'El correo no existe' }
		}).as('postInscripcionNoRegistrado');

		cy.get('input#nombre').type('Carlos');
		cy.get('input#correo').type('correo.no.registrado@test.com');
		cy.contains('button', 'Inscribirse').click();

		cy.wait('@postInscripcionNoRegistrado');
		cy.contains(/correo no existe/i).should('be.visible');
	});

	it('DT_06_03: Si el nombre esta vacio se notifica invalido', () => {
		cy.get('input#correo').type('tester@ejemplo.com');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/El nombre es obligatorio/i).should('be.visible');
	});

	it('DT_06_03: Si el nombre tiene menos de 2 caracteres se notifica invalido', () => {
		cy.get('input#nombre').type('A');
		cy.get('input#correo').type('tester@ejemplo.com');
		cy.contains('button', 'Inscribirse').click();

		cy.contains(/nombre no es valido|al menos/i).should('be.visible');
	});

	it('DT_06_04: Si el correo es valido se registra el tester en el proyecto', () => {
		cy.intercept('POST', '/api/inscripciones', (req) => {
			expect(req.body).to.deep.equal({
				nombre: 'Carlos Tester',
				correo: 'carlos@test.com',
				id_proyectos: proyectoId
			});

			req.reply({
				statusCode: 201,
				body: {
					message: 'Inscripcion guardada exitosamente',
					id: 25,
					nombre: 'Carlos Tester',
					correo: 'carlos@test.com',
					id_proyectos: proyectoId
				}
			});
		}).as('postInscripcionExitosa');

		cy.get('input#nombre').type('Carlos Tester');
		cy.get('input#correo').type('carlos@test.com');
		cy.contains('button', 'Inscribirse').click();

		cy.wait('@postInscripcionExitosa');
		cy.contains(/inscripcion guardada exitosamente|guardada exitosamente/i).should('be.visible');
	});
});