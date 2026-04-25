/// <reference types="cypress" />

describe('INTEGRACION: DT_08 - Enviar feedback', () => {
  const proyectoId = '808';
  const usuario = 'integracion.feedback@test.com';

  const proyectoDetalle = {
    id: Number(proyectoId),
    nombre: 'Proyecto Integracion Feedback',
    descripcion: 'Proyecto para pruebas integradas de feedback',
    nombre_fichero: 'script.bat',
    fecha_creacion: '2026-04-21T10:00:00Z',
  };

  const proyectoApi = {
    id: Number(proyectoId),
    nombre: 'Proyecto Integracion Feedback',
    correo: 'owner.integracion@test.com',
    archivo_path: 'uploads/script.bat',
    fecha_creacion: '2026-04-21T10:00:00Z',
  };

  const bodyToText = (body) => {
    if (typeof body === 'string') return body;
    if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
    if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body.buffer);
    return String(body || '');
  };

  const interceptResultadoConsulta = ({ inscrito = true, detalle = proyectoDetalle } = {}) => {
    cy.intercept('GET', new RegExp(`/api/proyectos/${proyectoId}$`), {
      statusCode: 200,
      body: detalle,
    }).as('getDetalleProyecto');

    cy.intercept('GET', /\/api\/inscripciones\/check.*/, {
      statusCode: 200,
      body: { inscrito },
    }).as('checkInscripcion');
  };

  const visitResultadoConsulta = ({ usuarioLogueado = usuario } = {}) => {
    cy.visit(`/resultado-consulta/${proyectoId}`, {
      onBeforeLoad(win) {
        if (usuarioLogueado) {
          win.localStorage.setItem('usuario_correo', usuarioLogueado);
          win.localStorage.setItem('usuario', usuarioLogueado); // Clave crítica para AuthContext
          win.localStorage.setItem('correo', usuarioLogueado);  // Clave de respaldo
          win.localStorage.setItem('usuario_tipo', 'tester');
        }
      },
    });
    cy.wait('@getDetalleProyecto');
    cy.wait('@checkInscripcion');
  };

  const visitFeedback = ({ usuarioLogueado = usuario } = {}) => {
    cy.visit(`/feedback/${proyectoId}`, {
      onBeforeLoad(win) {
        if (usuarioLogueado) {
          win.localStorage.setItem('usuario_correo', usuarioLogueado);
          win.localStorage.setItem('usuario', usuarioLogueado);
          win.localStorage.setItem('correo', usuarioLogueado);
          win.localStorage.setItem('usuario_tipo', 'tester');
        }
      },
    });

    cy.intercept('GET', new RegExp(`/api/proyectos/${proyectoId}$`), {
      statusCode: 200,
      body: proyectoApi,
    }).as('getProyectoFeedback');

    cy.wait('@getProyectoFeedback');
  };

  const completarFormulario = (texto = 'Feedback integrado de prueba') => {
    cy.get('textarea#texto-feedback').clear().type(texto, { delay: 0 });
    cy.get('input#archivo-feedback').selectFile('cypress/fixtures/documento.txt', { force: true });
  };

  it('IT_FB_001: ResultadoConsulta muestra boton Enviar feedback cuando usuario ya esta inscrito', () => {
    interceptResultadoConsulta({ inscrito: true });
    visitResultadoConsulta();

    cy.contains('a.btn-feedback', 'Enviar feedback').should('be.visible');
    // Selector corregido: btn-participar -> btn-inscripcion
    cy.contains('a.btn-inscripcion', 'Inscribirse como Tester').should('not.exist');
  });

  it('IT_FB_002: ResultadoConsulta muestra Inscribirse cuando usuario no esta inscrito', () => {
    interceptResultadoConsulta({ inscrito: false });
    visitResultadoConsulta();

    // Ahora que el usuario está logueado correctamente, aparecerá este texto
    cy.contains('a.btn-inscripcion', 'Inscribirse como Tester').should('be.visible');
    cy.contains('a.btn-feedback', 'Enviar feedback').should('not.exist');
  });

  it('IT_FB_003: Flujo de navegacion desde ResultadoConsulta a Feedback', () => {
    interceptResultadoConsulta({ inscrito: true });
    cy.intercept('GET', `/api/proyectos/${proyectoId}`, {
      statusCode: 200,
      body: proyectoApi,
    }).as('getProyectoFeedbackNav');

    visitResultadoConsulta();
    cy.contains('a.btn-feedback', 'Enviar feedback').click();

    cy.url().should('include', `/feedback/${proyectoId}`);
    cy.wait('@getProyectoFeedbackNav');
    cy.contains('h2', 'Enviar feedback').should('be.visible');
  });

  it('IT_FB_004: Sin sesion se muestra mensaje para iniciar sesion', () => {
    visitFeedback({ usuarioLogueado: null });

    cy.contains('.feedback-error-general', 'Debes').should('be.visible');
    cy.contains('a', /iniciar sesi.n/i).should('be.visible');
  });

  it('IT_FB_005: La vista de feedback muestra enlace para volver al proyecto', () => {
    visitFeedback();

    cy.get('a.feedback-volver').should('have.attr', 'href', `/resultado-consulta/${proyectoId}`);
  });

  it('IT_FB_006: Muestra estado de carga antes de recibir proyecto', () => {
    visitFeedback({ delay: 1200, waitProject: false });

    cy.contains('.feedback-readonly', 'Cargando...').should('be.visible');
    cy.wait('@getProyectoFeedback');
  });

  it('IT_FB_007: Con GET exitoso de proyecto renderiza datos del formulario', () => {
    visitFeedback();

    cy.contains('.feedback-nombre-proyecto', 'Proyecto Integracion Feedback').should('be.visible');
    cy.contains('.feedback-readonly', 'Proyecto Integracion Feedback').should('be.visible');
    cy.contains('.feedback-readonly', usuario).should('be.visible');
  });

  it('IT_FB_008: Si GET /api/proyectos/:id devuelve 404, se muestra error de proyecto', () => {
    visitFeedback({ statusCode: 404, body: { error: 'Proyecto no encontrado' } });

    cy.contains('.feedback-error-general', 'El proyecto no existe o ha sido borrado.').should('be.visible');
  });

  it('IT_FB_009: Si GET /api/proyectos/:id falla con 500, se muestra error controlado', () => {
    visitFeedback({ statusCode: 500, body: { error: 'Error interno' } });

    cy.contains('.feedback-error-general', 'El proyecto no existe o ha sido borrado.').should('be.visible');
  });

  it('IT_FB_010: Si id en ruta es invalido, la vista maneja el error de proyecto', () => {
    visitFeedback({ id: 'abc', statusCode: 400, body: { error: 'ID de proyecto inválido' } });

    cy.contains('.feedback-error-general', 'El proyecto no existe o ha sido borrado.').should('be.visible');
  });

  it('IT_FB_011: Formulario vacio muestra errores y evita llamada al backend', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback').as('postFeedbackBloqueado');

    cy.get('button.feedback-boton-enviar').click();

    cy.contains('.feedback-error-texto', 'Los comentarios no pueden estar vac').should('be.visible');
    cy.contains('.feedback-error-texto', 'Debes adjuntar al menos un documento').should('be.visible');
    cy.get('@postFeedbackBloqueado.all').should('have.length', 0);
  });

  it('IT_FB_012: Comentario de exactamente 1000 caracteres permite envio', () => {
    const texto1000 = 'A'.repeat(1000);

    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      statusCode: 201,
      body: { message: 'Feedback enviado correctamente' },
    }).as('postFeedback1000');

    completarFormulario(texto1000);
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback1000');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
  });

  it('IT_FB_013: Contador de caracteres se actualiza al escribir y borrar', () => {
    visitFeedback();

    cy.get('textarea#texto-feedback').type('12345');
    cy.contains('small', '5/1000 caracteres').should('be.visible');

    cy.get('textarea#texto-feedback').clear().type('12');
    cy.contains('small', '2/1000 caracteres').should('be.visible');
  });

  it('IT_FB_014: El boton enviar permanece deshabilitado mientras se carga proyecto', () => {
    visitFeedback({ delay: 1200, waitProject: false });

    cy.get('button.feedback-boton-enviar').should('be.disabled');
    cy.wait('@getProyectoFeedback');
  });

  it('IT_FB_015: Durante POST lento se deshabilitan campos y boton', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      delay: 1200,
      statusCode: 201,
      body: { message: 'Feedback enviado correctamente' },
    }).as('postFeedbackLento');

    completarFormulario();
    cy.get('button.feedback-boton-enviar').click();

    cy.contains('button.feedback-boton-enviar', 'Enviando...').should('be.disabled');
    cy.get('textarea#texto-feedback').should('be.disabled');
    cy.get('input#archivo-feedback').should('be.disabled');

    cy.wait('@postFeedbackLento');
  });

  it('IT_FB_016: Si backend devuelve 403 se notifica no inscrito', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      statusCode: 403,
      body: { error: 'Solo los testers inscritos pueden enviar feedback' },
    }).as('postFeedback403');

    completarFormulario();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback403');
    cy.contains('.feedback-error-general', /No est.*inscrito en este proyecto/i).should('be.visible');
  });

  it('IT_FB_017: Si proyecto se borra entre carga y submit se notifica 404', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      statusCode: 404,
      body: { error: 'El proyecto no existe o ha sido borrado' },
    }).as('postFeedback404Submit');

    completarFormulario('Feedback antes de borrado');
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback404Submit');
    cy.contains('.feedback-error-general', 'El proyecto no existe o ha sido borrado.').should('be.visible');
  });

  it('IT_FB_018: Si backend responde 500 con mensaje se renderiza mensaje del backend', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      statusCode: 500,
      body: { error: 'Error interno controlado de feedback' },
    }).as('postFeedback500Mensaje');

    completarFormulario();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback500Mensaje');
    cy.contains('.feedback-error-general', 'Error interno controlado de feedback').should('be.visible');
  });

  it('IT_FB_019: Si backend responde 500 sin error usa mensaje fallback', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      statusCode: 500,
      body: {},
    }).as('postFeedback500Fallback');

    completarFormulario();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedback500Fallback');
    cy.contains('.feedback-error-general', 'No se pudo enviar el feedback').should('be.visible');
  });

  it('IT_FB_020: Si hay error de red se informa problema de conexion', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', { forceNetworkError: true }).as('postFeedbackNetError');

    completarFormulario();
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackNetError');
    cy.contains('.feedback-error-general', 'Error de conex').should('be.visible');
  });

  it('IT_FB_021: En exito se muestra confirmacion y enlace a busqueda', () => {
    visitFeedback();
    cy.intercept('POST', '/api/feedback', {
      statusCode: 201,
      body: { message: 'Feedback enviado correctamente' },
    }).as('postFeedbackOK');

    completarFormulario('Feedback exitoso de integracion');
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackOK');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
    cy.get('a.feedback-link-busqueda').should('have.attr', 'href', '/busqueda');
  });

  it('IT_FB_022: Payload multipart incluye correo, id, texto trim y archivo', () => {
    const textoConEspacios = '   texto trim integracion   ';

    visitFeedback();
    cy.intercept('POST', '/api/feedback', (req) => {
      const bodyText = bodyToText(req.body);

      expect(req.headers['content-type']).to.include('multipart/form-data');
      expect(bodyText).to.include('name="correo"');
      expect(bodyText).to.include(usuario);
      expect(bodyText).to.include('name="id_proyectos"');
      expect(bodyText).to.include(proyectoId);
      expect(bodyText).to.include('name="texto"');
      expect(bodyText).to.include('texto trim integracion');
      expect(bodyText).to.not.include(textoConEspacios);
      expect(bodyText).to.include('name="archivo"; filename="documento.txt"');

      req.reply({ statusCode: 201, body: { message: 'Feedback enviado correctamente' } });
    }).as('postPayloadFeedback');

    completarFormulario(textoConEspacios);
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postPayloadFeedback');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
  });

  it('IT_FB_023: Comentario con caracteres especiales y saltos de linea se envia sin romper flujo', () => {
    const textoEspecial = 'Linea 1\nLinea 2 con acentos: áéíóú ñ ¿? ¡!';

    visitFeedback();
    cy.intercept('POST', '/api/feedback', (req) => {
      const bodyText = bodyToText(req.body);
      expect(bodyText).to.include('Linea 1');
      expect(bodyText).to.include('Linea 2 con acentos');

      req.reply({ statusCode: 201, body: { message: 'Feedback enviado correctamente' } });
    }).as('postFeedbackEspecial');

    completarFormulario(textoEspecial);
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackEspecial');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
  });

  it('IT_FB_024: Cadena tipo SQL se transmite como texto y no rompe el cliente', () => {
    const textoSql = "'; DROP TABLE feedback; --";

    visitFeedback();
    cy.intercept('POST', '/api/feedback', (req) => {
      const bodyText = bodyToText(req.body);
      expect(bodyText).to.include(textoSql);

      req.reply({ statusCode: 201, body: { message: 'Feedback enviado correctamente' } });
    }).as('postFeedbackSqlLike');

    completarFormulario(textoSql);
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackSqlLike');
    cy.contains('.feedback-exito', 'Feedback enviado correctamente').should('be.visible');
  });

  it('IT_FB_025: Correo manipulado en localStorage como no inscrito termina en 403', () => {
    visitFeedback({ usuarioLogueado: 'correo.manipulado@test.com' });
    cy.intercept('POST', '/api/feedback', {
      statusCode: 403,
      body: { error: 'Solo los testers inscritos pueden enviar feedback' },
    }).as('postFeedbackManipulado403');

    completarFormulario('Intento con correo manipulado');
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackManipulado403');
    cy.contains('.feedback-error-general', /No est.*inscrito/i).should('be.visible');
  });

  it('IT_FB_026: Usuario inscrito en otro proyecto recibe 403 al enviar en este proyecto', () => {
    visitFeedback({ usuarioLogueado: 'inscrito.otro.proyecto@test.com' });
    cy.intercept('POST', '/api/feedback', {
      statusCode: 403,
      body: { error: 'Solo los testers inscritos pueden enviar feedback' },
    }).as('postFeedbackOtroProyecto403');

    completarFormulario('Feedback para proyecto donde no esta inscrito');
    cy.get('button.feedback-boton-enviar').click();

    cy.wait('@postFeedbackOtroProyecto403');
    cy.contains('.feedback-error-general', /No est.*inscrito/i).should('be.visible');
  });
});
