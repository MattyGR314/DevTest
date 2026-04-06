/// <reference types="cypress" />

describe('DT_01 - Registro de usuario', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('/registro');
  });

  const completarFormulario = (correo, contrasena, confirmarContrasena) => {
    cy.get('input#correo').clear().type(correo);
    cy.get('input#contrasena').clear().type(contrasena);
    cy.get('input#confirmarContrasena').clear().type(confirmarContrasena);
  };

  it('DT_01_1: Mostrar formulario de registro con campos y botones obligatorios', () => {
    cy.contains('h2', 'Crear cuenta').should('be.visible');

    cy.get('input#correo')
      .should('be.visible')
      .and('have.attr', 'type', 'email');

    cy.get('input#contrasena')
      .should('be.visible')
      .and('have.attr', 'type', 'password');

    cy.get('input#confirmarContrasena')
      .should('be.visible')
      .and('have.attr', 'type', 'password');

    cy.contains('button', 'Registrarse').should('be.visible');
    cy.contains('button', 'Cancelar').should('be.visible');
    cy.contains('.required-note', 'Campos obligatorios').should('be.visible');
  });

  it('DT_01_2: Bloquear envio y mostrar errores cuando faltan campos obligatorios', () => {
    cy.intercept('POST', '/api/registro').as('postRegistroVacio');

    cy.contains('button', 'Registrarse').click();

    cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');
    cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');
    cy.contains('[role="alert"]', 'Debes confirmar la contraseña').should('be.visible');

    cy.get('@postRegistroVacio.all').should('have.length', 0);
  });

  it('DT_01_3: Rechazar correo con formato inválido sin enviar petición al backend', () => {
    cy.intercept('POST', '/api/registro').as('postRegistroCorreoInvalido');

    completarFormulario('correo-invalido', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.contains('[role="alert"]', 'El correo no tiene un formato válido').should('be.visible');
    cy.get('@postRegistroCorreoInvalido.all').should('have.length', 0);
  });

  it('DT_01_4: Rechazar cuando las contraseñas no coinciden', () => {
    cy.intercept('POST', '/api/registro').as('postRegistroContrasenaNoCoincide');

    completarFormulario('usuario@test.com', '123456', 'abcdef');
    cy.contains('button', 'Registrarse').click();

    cy.contains('[role="alert"]', 'Las contraseñas no coinciden').should('be.visible');
    cy.get('@postRegistroContrasenaNoCoincide.all').should('have.length', 0);
  });

  it('DT_01_5: Tratar entradas con solo espacios como campos vacios', () => {
    completarFormulario('   ', '   ', '   ');
    cy.contains('button', 'Registrarse').click();

    cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');
    cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');
    cy.contains('[role="alert"]', 'Debes confirmar la contraseña').should('be.visible');
  });

  it('DT_01_6: Limpiar solo el error del campo corregido sin borrar otros errores', () => {
    cy.contains('button', 'Registrarse').click();

    cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('be.visible');
    cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');

    cy.get('input#correo').type('corregido@test.com');

    cy.contains('[role="alert"]', 'El correo electrónico es obligatorio').should('not.exist');
    cy.contains('[role="alert"]', 'La contraseña es obligatoria').should('be.visible');
    cy.contains('[role="alert"]', 'Debes confirmar la contraseña').should('be.visible');
  });

  it('DT_01_7: Limpiar formulario y errores al presionar Cancelar', () => {
    cy.contains('button', 'Registrarse').click();
    cy.contains('[role="alert"]', 'Debes confirmar la contraseña').should('be.visible');

    completarFormulario('reset@test.com', '123456', '123456');
    cy.contains('button', 'Cancelar').click();

    cy.get('input#correo').should('have.value', '');
    cy.get('input#contrasena').should('have.value', '');
    cy.get('input#confirmarContrasena').should('have.value', '');
    cy.get('[role="alert"]').should('not.exist');
  });


  it('DT_01_8: Mostrar estado de envío y deshabilitar botones mientras se procesa el registro', () => {
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertRegistroLento');
    });

    cy.intercept('POST', '/api/registro', {
      delay: 1200,
      statusCode: 201,
      body: { message: 'Usuario registrado correctamente' }
    }).as('postRegistroLento');

    completarFormulario('lento@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.contains('button', 'Registrando...').should('be.disabled');
    cy.contains('button', 'Cancelar').should('be.disabled');

    cy.wait('@postRegistroLento');
    cy.get('@postRegistroLento').its('response.statusCode').should('eq', 201);
    cy.get('@alertRegistroLento')
      .should('have.been.calledWith', 'Usuario registrado correctamente. Ya puedes iniciar sesión.');
  });

  it('DT_01_9: Enviar payload correcto, mostrar alerta y redirigir en registro exitoso', () => {
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertRegistroExitoso');
    });

    cy.intercept('POST', '/api/registro', (req) => {
      expect(req.body).to.deep.equal({
        correo: 'nuevo@test.com',
        contrasena: '123456'
      });

      req.reply({
        statusCode: 201,
        body: { message: 'Usuario registrado correctamente' }
      });
    }).as('postRegistroExitoso');

    completarFormulario('nuevo@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.wait('@postRegistroExitoso');
    cy.get('@alertRegistroExitoso')
      .should('have.been.calledWith', 'Usuario registrado correctamente. Ya puedes iniciar sesión.');
    cy.location('pathname').should('eq', '/iniciarsesion');
  });

  it('DT_01_10: Limpiar error de correo duplicado cuando el usuario corrige el correo', () => {
    cy.intercept('POST', '/api/registro', {
      statusCode: 409,
      body: { error: 'Ya existe un usuario con ese correo' }
    }).as('postRegistroDuplicado');

    completarFormulario('duplicado@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.wait('@postRegistroDuplicado');
    cy.contains('[role="alert"]', 'Ya existe un usuario con ese correo').should('be.visible');

    cy.get('input#correo').type('nuevo');
    cy.contains('[role="alert"]', 'Ya existe un usuario con ese correo').should('not.exist');
  });

  it('DT_01_11: Mostrar error de correo duplicado cuando backend responde 409', () => {
    cy.intercept('POST', '/api/registro', {
      statusCode: 409,
      body: { error: 'Ya existe un usuario con ese correo' }
    }).as('postRegistro409');

    completarFormulario('existente@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.wait('@postRegistro409');
    cy.contains('[role="alert"]', 'Ya existe un usuario con ese correo').should('be.visible');
  });

  it('DT_01_12: Mostrar mensaje de error del backend en fallos no controlados', () => {
    cy.intercept('POST', '/api/registro', {
      statusCode: 500,
      body: { error: 'Error interno inesperado' }
    }).as('postRegistro500ConMensaje');

    completarFormulario('error500@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.wait('@postRegistro500ConMensaje');
    cy.contains('[role="alert"]', 'Error interno inesperado').should('be.visible');
  });

  it('DT_01_13: Mostrar mensaje fallback cuando backend falla sin detalle de error', () => {
    cy.intercept('POST', '/api/registro', {
      statusCode: 500,
      body: {}
    }).as('postRegistro500SinMensaje');

    completarFormulario('fallback@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.wait('@postRegistro500SinMensaje');
    cy.contains('[role="alert"]', 'Error del servidor').should('be.visible');
  });

  it('DT_01_14: Mostrar error de conexión cuando falla la petición de red', () => {
    cy.intercept('POST', '/api/registro', {
      forceNetworkError: true
    }).as('postRegistroRed');

    completarFormulario('red@test.com', '123456', '123456');
    cy.contains('button', 'Registrarse').click();

    cy.wait('@postRegistroRed');
    cy.contains('[role="alert"]', 'Error de conexión con el servidor').should('be.visible');
  });
});
