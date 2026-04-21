/// <reference types="cypress" />

describe('DT_08 - API enviar feedback', () => {
  const baseUrl = Cypress.config('baseUrl');
  const seed = Date.now();

  let idProyecto = null;

  const correoOwner = `owner.feedback.${seed}@test.com`;
  const correoNoInscrito = `no.inscrito.feedback.${seed}@test.com`;
  const correoInscrito = `inscrito.feedback.${seed}@test.com`;

  const enviarFeedbackMultipart = ({ correo, id, texto, filePath = 'cypress/fixtures/documento.txt' }) => {
    return cy.task('multipartRequest', {
      url: `${baseUrl}/api/feedback`,
      method: 'POST',
      fields: {
        correo,
        id_proyectos: id,
        texto,
      },
      filePath,
      fileField: 'archivo',
    });
  };

  before(() => {
    cy.task('multipartRequest', {
      url: `${baseUrl}/subircodigo`,
      method: 'POST',
      fields: {
        nombre: `Proyecto API Feedback ${seed}`,
        correo: correoOwner,
        descripcion: 'Proyecto para pruebas de feedback API',
      },
      filePath: 'cypress/fixtures/script.bat',
      fileField: 'archivo',
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('id');
      idProyecto = response.body.id;
    });
  });

  it('DT_08_API_01: 400 cuando falta correo', () => {
    cy.request({
      method: 'POST',
      url: '/api/feedback',
      failOnStatusCode: false,
      body: {
        correo: '',
        id_proyectos: '1',
        texto: 'Texto valido',
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('El correo es obligatorio');
    });
  });

  it('DT_08_API_02: 400 cuando id de proyecto es invalido', () => {
    cy.request({
      method: 'POST',
      url: '/api/feedback',
      failOnStatusCode: false,
      body: {
        correo: 'tester.api.feedback@test.com',
        id_proyectos: 'abc',
        texto: 'Texto valido',
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('ID de proyecto inválido');
    });
  });

  it('DT_08_API_03: 400 cuando texto esta vacio', () => {
    cy.request({
      method: 'POST',
      url: '/api/feedback',
      failOnStatusCode: false,
      body: {
        correo: 'tester.api.feedback@test.com',
        id_proyectos: '1',
        texto: '   ',
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('Los comentarios no pueden estar vacíos');
    });
  });

  it('DT_08_API_04: 400 cuando texto supera 1000 caracteres', () => {
    cy.request({
      method: 'POST',
      url: '/api/feedback',
      failOnStatusCode: false,
      body: {
        correo: 'tester.api.feedback@test.com',
        id_proyectos: '1',
        texto: 'A'.repeat(1001),
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('El feedback no puede exceder 1000 caracteres');
    });
  });

  it('DT_08_API_05: 400 cuando falta archivo', () => {
    cy.request({
      method: 'POST',
      url: '/api/feedback',
      failOnStatusCode: false,
      body: {
        correo: 'tester.api.feedback@test.com',
        id_proyectos: String(idProyecto || 1),
        texto: 'Texto valido sin archivo',
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('Debes adjuntar al menos un documento');
    });
  });

  it('DT_08_API_06: 404 cuando proyecto no existe', () => {
    const idInexistente = 999999999;

    enviarFeedbackMultipart({
      correo: correoNoInscrito,
      id: idInexistente,
      texto: 'Feedback sobre proyecto inexistente',
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.error).to.eq('El proyecto no existe o ha sido borrado');
    });
  });

  it('DT_08_API_07: 403 cuando usuario no esta inscrito', () => {
    expect(idProyecto).to.be.a('number');

    enviarFeedbackMultipart({
      correo: correoNoInscrito,
      id: idProyecto,
      texto: 'Feedback de usuario no inscrito',
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.body.error).to.eq('Solo los testers inscritos pueden enviar feedback');
    });
  });

  it('DT_08_API_08: 201 cuando feedback se guarda correctamente', () => {
    expect(idProyecto).to.be.a('number');

    cy.request({
      method: 'POST',
      url: '/api/inscripciones',
      failOnStatusCode: false,
      body: {
        nombre: 'Tester API Feedback',
        correo: correoInscrito,
        id_proyectos: idProyecto,
      },
    }).then((responseInscripcion) => {
      expect(responseInscripcion.status).to.eq(201);
    });

    enviarFeedbackMultipart({
      correo: correoInscrito,
      id: idProyecto,
      texto: 'Feedback registrado correctamente por API',
    }).then((responseFeedback) => {
      expect(responseFeedback.status).to.eq(201);
      expect(responseFeedback.body.message).to.eq('Feedback enviado correctamente');
    });
  });
});
