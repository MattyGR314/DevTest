/// <reference types="cypress" />

describe('DT_08 - Enviar feedback de proyecto', () => {
  const proyectoId = '123';
  const usuario = 'tester.feedback@test.com';
  const proyectoMock = {
    id: 123,
    nombre: 'Proyecto QA Feedback',
    correo: 'owner@test.com',
    archivo_path: 'uploads/proyecto.exe'
  };

  const bodyToText = (body) => {
    if (typeof body === 'string') return body;
    if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
    if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body.buffer);
    return String(body || '');
  };

  const visitFeedback = ({
    usuarioLogueado = usuario,
    proyectoStatusCode = 200,
    proyectoBody = proyectoMock,
    proyectoDelay = 0
  } = {}) => {
    cy.intercept('GET', `/api/proyectos/${proyectoId}`, {
      statusCode: proyectoStatusCode,
      delay: proyectoDelay,
      body: proyectoBody
    }).as('getProyectoFeedback');

    cy.visit(`/feedback/${proyectoId}`, {
      onBeforeLoad(win) {
        if (usuarioLogueado) {
          win.localStorage.setItem('usuario_correo', usuarioLogueado);
        } else {
          win.localStorage.removeItem('usuario_correo');
        }
      }
    });
  };

  const completarFormularioValido = (texto = 'Feedback funcional de prueba') => {
    cy.get('textarea#texto-feedback').clear().type(texto, { delay: 0 });
    cy.get('input#archivo-feedback').selectFile('cypress/fixtures/documento.txt', { force: true });
  };

  it('DT_08_01: Sin sesion se solicita iniciar sesion', () => {
    visitFeedback({ usuarioLogueado: null });

    cy.contains('h2', 'Enviar feedback').should('be.visible');
    cy.contains('.feedback-error-general', 'Debes').should('be.visible');
    cy.contains('a', /iniciar sesi.n/i).should('be.visible');
  });

  it('DT_08_02: Muestra estado de carga del proyecto', () => {
    visitFeedback({ proyectoDelay: 1200 });

    cy.contains('.feedback-readonly', 'Cargando...').should('be.visible');
    cy.wait('@getProyectoFeedback');
  });

  it('DT_08_03: Muestra nombre del proyecto al cargar correctamente', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.contains('.feedback-nombre-proyecto', 'Proyecto QA Feedback').should('be.visible');
    cy.contains('.feedback-readonly', 'Proyecto QA Feedback').should('be.visible');
  });

  it('DT_08_04: Si el proyecto no existe muestra error', () => {
    visitFeedback({ proyectoStatusCode: 404, proyectoBody: { error: 'Proyecto no encontrado' } });
    cy.wait('@getProyectoFeedback');

    cy.contains('.feedback-error-general', 'El proyecto no existe o ha sido borrado.').should('be.visible');
  });

  it('DT_08_05: Rechaza comentarios vacios', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.get('button.feedback-boton-enviar').click();

    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('be.visible');
  });

  it('DT_08_06: Rechaza comentarios con solo espacios', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.get('textarea#texto-feedback').type('   ');
    cy.get('button.feedback-boton-enviar').click();

    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('be.visible');
  });

  it('DT_08_07: Rechaza comentarios con mas de 1000 caracteres', () => {
    const textoLargo = 'A'.repeat(1001);

    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.get('textarea#texto-feedback')
      .invoke('removeAttr', 'maxlength')
      .type(textoLargo, { delay: 0 });

    cy.get('input#archivo-feedback').selectFile('cypress/fixtures/documento.txt', { force: true });
    cy.get('button.feedback-boton-enviar').click();

    cy.contains('.feedback-error-texto', 'no puede exceder 1000 caracteres').should('be.visible');
  });

  it('DT_08_08: Rechaza envio cuando no hay archivo', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.get('textarea#texto-feedback').type('Texto valido de feedback');
    cy.get('button.feedback-boton-enviar').click();

    cy.contains('.feedback-error-texto', 'Debes adjuntar al menos un documento').should('be.visible');
  });

  it('DT_08_09: Si hay errores de validacion no llama al backend', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback').as('postFeedbackNoEnviado');

    cy.get('button.feedback-boton-enviar').click();

    cy.get('@postFeedbackNoEnviado.all').should('have.length', 0);
  });

  it('DT_08_10: Al corregir texto limpia solo el error de texto', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.get('button.feedback-boton-enviar').click();
    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('be.visible');
    cy.contains('.feedback-error-texto', 'Debes adjuntar al menos un documento').should('be.visible');

    cy.get('textarea#texto-feedback').type('Texto corregido');

    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('not.exist');
    cy.contains('.feedback-error-texto', 'Debes adjuntar al menos un documento').should('be.visible');
  });

  it('DT_08_11: Al seleccionar archivo limpia solo el error de archivo', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.get('button.feedback-boton-enviar').click();
    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('be.visible');
    cy.contains('.feedback-error-texto', 'Debes adjuntar al menos un documento').should('be.visible');

    cy.get('input#archivo-feedback').selectFile('cypress/fixtures/documento.txt', { force: true });

    cy.contains('.feedback-error-texto', 'Debes adjuntar al menos un documento').should('not.exist');
    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('be.visible');
  });

  it('DT_08_12: Durante envio deshabilita campos y boton', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      delay: 1200,
      statusCode: 201,
      body: { message: 'Feedback enviado correctamente' }
    }).as('postFeedbackLento');

    completarFormularioValido('Feedback con espera de red');
    cy.get('button.feedback-boton-enviar').click();

    cy.contains('button.feedback-boton-enviar', 'Enviando...').should('be.disabled');
    cy.get('textarea#texto-feedback').should('be.disabled');
    cy.get('input#archivo-feedback').should('be.disabled');

    cy.wait('@postFeedbackLento');
  });

  it('DT_08_13: Si backend responde 403 muestra error de no inscrito', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      statusCode: 403,
      body: { error: 'Solo los testers inscritos pueden enviar feedback' }
    }).as('postFeedback403');

    completarFormularioValido();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback403');
    cy.contains('.feedback-error-general', /No est.*inscrito en este proyecto/i).should('be.visible');
  });

  it('DT_08_14: Si backend responde 404 muestra error de proyecto borrado', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      statusCode: 404,
      body: { error: 'El proyecto no existe o ha sido borrado' }
    }).as('postFeedback404');

    completarFormularioValido();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback404');
    cy.contains('.feedback-error-general', 'El proyecto no existe o ha sido borrado.').should('be.visible');
  });

  it('DT_08_15: Si backend falla con mensaje, lo muestra', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      statusCode: 500,
      body: { error: 'Error interno inesperado en feedback' }
    }).as('postFeedback500ConMensaje');

    completarFormularioValido();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback500ConMensaje');
    cy.contains('.feedback-error-general', 'Error interno inesperado en feedback').should('be.visible');
  });

  it('DT_08_16: Si backend falla sin mensaje usa fallback', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      statusCode: 500,
      body: {}
    }).as('postFeedback500SinMensaje');

    completarFormularioValido();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback500SinMensaje');
    cy.contains('.feedback-error-general', 'No se pudo enviar el feedback').should('be.visible');
  });

  it('DT_08_17: Si hay error de red muestra mensaje de conexion', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      forceNetworkError: true
    }).as('postFeedbackRed');

    completarFormularioValido();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackRed');
    cy.contains('.feedback-error-general', 'Error de conex').should('be.visible');
  });

  it('DT_08_18: Envio exitoso muestra confirmacion', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', {
      statusCode: 201,
      body: { message: 'Feedback enviado correctamente' }
    }).as('postFeedbackOk');

    completarFormularioValido('Feedback exitoso');
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackOk');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
    cy.contains('a.feedback-link-busqueda', /Volver a b.squeda/i).should('be.visible');
  });

  it('DT_08_19: Envia FormData con correo, id, texto trim y archivo', () => {
    visitFeedback();
    cy.wait('@getProyectoFeedback');

    cy.intercept('POST', '/api/feedback', (req) => {
      const bodyText = bodyToText(req.body);

      expect(req.headers['content-type']).to.include('multipart/form-data');
      expect(bodyText).to.include('name="correo"');
      expect(bodyText).to.include(usuario);
      expect(bodyText).to.include('name="id_proyectos"');
      expect(bodyText).to.include(proyectoId);
      expect(bodyText).to.include('name="texto"');
      expect(bodyText).to.include('texto de prueba con espacios');
      expect(bodyText).to.not.include('   texto de prueba con espacios   ');
      expect(bodyText).to.include('name="archivo"; filename="documento.txt"');

      req.reply({
        statusCode: 201,
        body: { message: 'Feedback enviado correctamente' }
      });
    }).as('postFeedbackPayload');

    completarFormularioValido('   texto de prueba con espacios   ');
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackPayload');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
  });
});
