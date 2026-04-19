// cypress/e2e/integracion-registro-login.cy.js
describe('Integración: Registro (DT_01) + Login (DT_02)', () => {
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