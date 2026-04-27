/// <reference types="cypress" />

describe('INTEGRACION: DT_09 - Ver feedback del proyecto', () => {
  const proyectoId = '909';
  const usuarioDueno = 'dueno.feedback@test.com';
  const usuarioNoDueno = 'tester.feedback@test.com';

  const proyecto = {
    id: Number(proyectoId),
    nombre: 'Proyecto Integracion Ver Feedback',
    correo: usuarioDueno,
    descripcion: 'Proyecto de prueba para ver feedback',
    fecha_creacion: '2026-04-21T10:00:00Z',
  };

  const visitVerFeedback = ({ usuarioLogueado = usuarioDueno, id = proyectoId } = {}) => {
    cy.intercept('GET', `/api/proyectos/${id}/feedback`, (req) => {
      req.reply({
        statusCode: 200,
        body: [],
      });
    }).as('getFeedback');

    cy.visit(`/proyecto/${id}/ver-feedback`, {
      onBeforeLoad(win) {
        if (usuarioLogueado) {
          win.localStorage.setItem('usuario_correo', usuarioLogueado);
        } else {
          win.localStorage.removeItem('usuario_correo');
        }
      },
    });
  };

  it('IT_VF_001: sin sesion muestra el aviso para iniciar sesion', () => {
    visitVerFeedback({ usuarioLogueado: null });

    cy.contains('.feedback-error-general', 'Debes iniciar sesión para ver el feedback.').should('be.visible');
    cy.contains('a', 'iniciar sesión').should('have.attr', 'href', '/iniciarSesion');
    cy.get('.feedback-header a.feedback-volver').should('have.attr', 'href', `/resultado-consulta/${proyectoId}`);
  });

  it('IT_VF_002: la vista envía el correo del usuario en la cabecera X-User-Email', () => {
    cy.intercept('GET', `/api/proyectos/${proyectoId}/feedback`, (req) => {
      expect(req.headers['x-user-email']).to.equal(usuarioDueno);
      req.reply({
        statusCode: 200,
        body: [],
      });
    }).as('getFeedbackHeader');

    cy.visit(`/proyecto/${proyectoId}/ver-feedback`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioDueno);
      },
    });

    cy.wait('@getFeedbackHeader');
  });

  it('IT_VF_003: si la API devuelve 403, muestra el error de permisos', () => {
    cy.intercept('GET', `/api/proyectos/${proyectoId}/feedback`, {
      statusCode: 403,
      body: { error: 'Solo los dueños del proyecto pueden ver el feedback' },
    }).as('getFeedback403');

    cy.visit(`/proyecto/${proyectoId}/ver-feedback`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioNoDueno);
      },
    });

    cy.wait('@getFeedback403');
    cy.contains('.feedback-error-general', 'No eres el dueño de este proyecto. Solo los dueños pueden ver el feedback.').should('be.visible');
  });

  it('IT_VF_004: si la API devuelve 404, muestra el error de proyecto inexistente', () => {
    cy.intercept('GET', `/api/proyectos/${proyectoId}/feedback`, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' },
    }).as('getFeedback404');

    cy.visit(`/proyecto/${proyectoId}/ver-feedback`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioDueno);
      },
    });

    cy.wait('@getFeedback404');
    cy.contains('.feedback-error-general', 'El proyecto no existe.').should('be.visible');
  });

  it('IT_VF_005: si no hay feedback registrado, muestra el estado vacío', () => {
    visitVerFeedback();

    cy.wait('@getFeedback');
    cy.contains('.feedback-error-general', 'No hay feedback registrado para este proyecto.').should('be.visible');
  });

  it('IT_VF_006: con feedback disponible renderiza la lista y el enlace al archivo', () => {
    const feedback = [
      {
        id: 1,
        correo: 'tester1@test.com',
        nombre_usuario: 'Tester Uno',
        texto: 'La ejecución es correcta y el flujo responde bien.',
        archivo_path: 'feedback-1.txt',
        nombre_fichero: 'feedback-1.txt',
        fecha_creacion: '2026-04-25T10:00:00Z',
      },
      {
        id: 2,
        correo: 'tester2@test.com',
        nombre_usuario: null,
        texto: 'No encontré errores en la versión actual.',
        archivo_path: null,
        nombre_fichero: null,
        fecha_creacion: '2026-04-26T08:30:00Z',
      },
    ];

    cy.intercept('GET', `/api/proyectos/${proyectoId}/feedback`, {
      statusCode: 200,
      body: feedback,
    }).as('getFeedbackConDatos');

    cy.visit(`/proyecto/${proyectoId}/ver-feedback`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioDueno);
      },
    });

    cy.wait('@getFeedbackConDatos');
    cy.contains('h2', 'Feedback del proyecto').should('be.visible');
    cy.get('.feedback-lista').should('be.visible');
    cy.get('.feedback-item').should('have.length', 2);
    cy.contains('.feedback-meta', 'Tester Uno').should('be.visible');
    cy.contains('.feedback-texto', 'La ejecución es correcta y el flujo responde bien.').should('be.visible');
    cy.get('.feedback-archivo a').should('have.attr', 'href', '/uploads/feedback-1.txt');
    cy.contains('.feedback-meta', 'tester2@test.com').should('be.visible');
  });
});