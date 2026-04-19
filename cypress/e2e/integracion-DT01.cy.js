/*
// cypress/e2e/integracion-registro-login.cy.js
describe('Integración: Registro (DT_01) + Iniciar Sesion (DT_02)', () => {
  const email = `test-${Date.now()}@integracion.com`;
  const password = 'Test1234';

  before(() => {
    // limpiar la base de datos para evitar conflictos
    cy.task('db:clear', { table: 'usuarios', where: { correo: email } });
  });

  it('Debería registrar un usuario nuevo y luego iniciar sesión', () => {
    // Registro
    cy.visit('/registro');
    cy.get('input#correo').type(email);
    cy.get('input#contrasena').type(password);
    cy.get('input#confirmarContrasena').type(password);
    cy.get('select#tipoCuenta').select('developer');
    cy.contains('button', 'Crear cuenta').click();

    cy.contains('¡Cuenta creada!', { timeout: 5000 }).should('be.visible');
    cy.location('pathname', { timeout: 5000 }).should('eq', '/');

    // Iniciar Sesion
    cy.visit('/login');
    cy.get('input#correo').type(email);
    cy.get('input#contrasena').type(password);
    cy.contains('button', 'Iniciar sesión').click();

    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('Bienvenido').should('be.visible');
  });
});
*/


/// <reference types="cypress" />

describe('Integración DT_01 - Registro con stub de API', () => {
  beforeEach(() => {
    cy.visit('/registro');
  });

  const completarFormulario = (correo, contrasena, confirmarContrasena, tipoCuenta = 'developer') => {
    cy.get('input#correo').clear().type(correo);
    cy.get('input#contrasena').clear().type(contrasena);
    cy.get('input#confirmarContrasena').clear().type(confirmarContrasena);
    cy.get('select#tipoCuenta').select(tipoCuenta);
  };

  it('DT_01_INT_1: Registro exitoso - stub responde 201 y frontend muestra éxito', () => {
    // Stub (intercept) para la petición POST a /api/registro
    cy.intercept('POST', '/api/registro', {
      statusCode: 201,
      body: { message: 'Usuario registrado correctamente' },
    }).as('registroStub');

    completarFormulario('test@integracion.com', '12345678', '12345678', 'developer');
    cy.contains('button', 'Crear cuenta').click();

    // Verificar que la petición se envió con el payload correcto
    cy.wait('@registroStub').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        correo: 'test@integracion.com',
        contrasena: '12345678',
        tipoCuenta: 'developer',
      });
    });

    // Verificar que el frontend reacciona mostrando éxito
    cy.contains('¡Cuenta creada!').should('be.visible');
    cy.contains('Redirigiendo a inicio...').should('be.visible');
    cy.location('pathname', { timeout: 4000 }).should('eq', '/');
  });

  it('DT_01_INT_2: Correo duplicado - stub responde 409 y muestra error', () => {
    cy.intercept('POST', '/api/registro', {
      statusCode: 409,
      body: { error: 'Ya existe un usuario con ese correo' },
    }).as('registroDuplicado');

    completarFormulario('duplicado@test.com', '12345678', '12345678', 'developer');
    cy.contains('button', 'Crear cuenta').click();

    cy.wait('@registroDuplicado');
    cy.contains('[role="alert"]', 'Ya existe un usuario con ese correo').should('be.visible');
  });

  it('DT_01_INT_3: Error de servidor 500 - stub responde 500 con mensaje', () => {
    cy.intercept('POST', '/api/registro', {
      statusCode: 500,
      body: { error: 'Error interno inesperado' },
    }).as('registroError');

    completarFormulario('error@test.com', '12345678', '12345678', 'developer');
    cy.contains('button', 'Crear cuenta').click();

    cy.wait('@registroError');
    cy.contains('.registro-error-general', 'Error interno inesperado').should('be.visible');
  });

  it('DT_01_INT_4: Error de red - stub simula fallo de conexión', () => {
    cy.intercept('POST', '/api/registro', { forceNetworkError: true }).as('registroRed');

    completarFormulario('red@test.com', '12345678', '12345678', 'developer');
    cy.contains('button', 'Crear cuenta').click();

    cy.wait('@registroRed');
    cy.contains('.registro-error-general', 'Error de conexión con el servidor').should('be.visible');
  });
});