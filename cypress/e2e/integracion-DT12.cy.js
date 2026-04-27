/// <reference types="cypress" />

describe('INTEGRACION: DT_12 - Añadir detalles a un proyecto', () => {
  const proyectoId = '1201';
  const usuarioCreador = 'creador.dt12@test.com';
  const usuarioNoCreador = 'tester.dt12@test.com';

  const proyecto = {
    id: Number(proyectoId),
    nombre: 'Proyecto Integracion DT12',
    correo: usuarioCreador,
    descripcion: 'Proyecto de prueba para añadir detalles',
    fecha_creacion: '2026-04-20T09:15:00Z',
  };

  const detallesIniciales = {
    version: '1.2.0',
    plataforma: 'Windows',
    instrucciones: 'Ejecutar el instalador y seguir el asistente.',
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  const setUsuario = (correo) => {
    cy.visit('/', {
      onBeforeLoad(win) {
        if (correo) {
          win.localStorage.setItem('usuario_correo', correo);
        } else {
          win.localStorage.removeItem('usuario_correo');
        }
      },
    });
  };

  const stubBusqueda = (body = [proyecto]) => {
    cy.intercept('GET', '/api/proyectos', {
      statusCode: 200,
      body,
    }).as('listarProyectos');
  };

  const stubDetalles = ({
    proyectoStatus = 200,
    proyectoBody = proyecto,
    detallesStatus = 200,
    detallesBody = detallesIniciales,
    id = proyectoId,
  } = {}) => {
    cy.intercept('GET', `/api/proyectos/${id}`, {
      statusCode: proyectoStatus,
      body: proyectoBody,
    }).as('getProyecto');

    cy.intercept('GET', `/api/proyectos/${id}/detalles`, {
      statusCode: detallesStatus,
      body: detallesBody,
    }).as('getDetalles');
  };

  const visitarDetallesDirecto = (correo = usuarioCreador, options = {}) => {
    const id = options.id || proyectoId;
    stubDetalles({ ...options, id });

    cy.visit(`/detalles-proyecto/${id}`, {
      onBeforeLoad(win) {
        if (correo) {
          win.localStorage.setItem('usuario_correo', correo);
        } else {
          win.localStorage.removeItem('usuario_correo');
        }
      },
    });

    cy.wait('@getProyecto');
    cy.wait('@getDetalles');
  };

  it('IT_DT12_001: desde busqueda el creador ve el boton Añadir detalles y navega a la pantalla de detalles', () => {
    stubBusqueda();
    stubDetalles();
    setUsuario(usuarioCreador);

    cy.visit('/busqueda');
    cy.wait('@listarProyectos');

    cy.contains('.proyecto-tabla', proyecto.nombre).should('be.visible');
    cy.contains('a.detalles-proyecto-boton', 'Añadir detalles').should('be.visible').click();

    cy.wait('@getProyecto');
    cy.wait('@getDetalles');

    cy.url().should('include', `/detalles-proyecto/${proyectoId}`);
    cy.contains('h2', 'Detalles del proyecto').should('be.visible');
    cy.contains('.detalles-nombre-proyecto', proyecto.nombre).should('be.visible');
    cy.get('input#version').should('have.value', detallesIniciales.version);
    cy.get('select#plataforma').should('have.value', detallesIniciales.plataforma);
    cy.get('textarea#instrucciones').should('have.value', detallesIniciales.instrucciones);
  });

  it('IT_DT12_002: carga un proyecto sin detalles previos y permite editar el formulario', () => {
    visitarDetallesDirecto(usuarioCreador, {
      detallesBody: {},
    });

    cy.contains('h2', 'Detalles del proyecto').should('be.visible');
    cy.get('input#version').should('have.value', '');
    cy.get('select#plataforma').should('have.value', '');
    cy.get('textarea#instrucciones').should('have.value', '');

    cy.get('input#version').type('2.0.1');
    cy.get('select#plataforma').select('Linux');
    cy.get('textarea#instrucciones').type('Arrancar con npm start y abrir el navegador.');

    cy.get('input#version').should('have.value', '2.0.1');
    cy.get('select#plataforma').should('have.value', 'Linux');
    cy.get('textarea#instrucciones').should('contain.value', 'npm start');
  });

  it('IT_DT12_003: guardar detalles correctamente redirige a busqueda', () => {
    stubBusqueda([proyecto]);
    visitarDetallesDirecto(usuarioCreador, {
      detallesBody: {},
    });

    cy.intercept('PUT', `/api/proyectos/${proyectoId}/detalles`, (req) => {
      expect(req.body).to.deep.eq({
        correo: usuarioCreador,
        version: '3.0.0',
        plataforma: 'Multiplataforma',
        instrucciones: 'Seguir la guia de despliegue incluida.',
      });

      req.reply({
        statusCode: 200,
        body: { message: 'Detalles actualizados correctamente', id: Number(proyectoId) },
      });
    }).as('guardarDetalles');

    cy.get('input#version').clear().type('3.0.0');
    cy.get('select#plataforma').select('Multiplataforma');
    cy.get('textarea#instrucciones').clear().type('Seguir la guia de despliegue incluida.');
    cy.contains('button', 'Guardar detalles').click();

    cy.wait('@guardarDetalles');
    cy.url().should('include', '/busqueda');
    cy.wait('@listarProyectos');
    cy.contains('.proyecto-tabla', proyecto.nombre).should('be.visible');
  });

  it('IT_DT12_004: una version demasiado larga bloquea el guardado', () => {
    visitarDetallesDirecto(usuarioCreador, {
      detallesBody: {},
    });

    cy.intercept('PUT', `/api/proyectos/${proyectoId}/detalles`).as('guardarDetallesBloqueado');

    cy.get('input#version').then(($input) => {
      const input = $input[0];
      const longVersion = 'X'.repeat(51);
      const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeValueSetter.call(input, longVersion);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    cy.contains('button', 'Guardar detalles').click();

    cy.contains('.detalles-error-texto', 'La versión no puede superar 50 caracteres').should('be.visible');
    cy.get('@guardarDetallesBloqueado.all').should('have.length', 0);
  });

  it('IT_DT12_005: si el proyecto no existe se muestra el error correspondiente', () => {
    const idInexistente = '9999';

    cy.intercept('GET', `/api/proyectos/${idInexistente}`, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' },
    }).as('getProyecto404');

    cy.intercept('GET', `/api/proyectos/${idInexistente}/detalles`, {
      statusCode: 200,
      body: {},
    }).as('getDetalles404');

    cy.visit(`/detalles-proyecto/${idInexistente}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioCreador);
      },
    });

    cy.wait('@getProyecto404');
    cy.wait('@getDetalles404');

    cy.contains('.detalles-error-general', 'Proyecto no encontrado').should('be.visible');
    cy.get('form').should('be.visible');
  });

  it('IT_DT12_006: un usuario que no es el creador recibe error 403 al guardar', () => {
    visitarDetallesDirecto(usuarioNoCreador, {
      detallesBody: {},
    });

    cy.intercept('PUT', `/api/proyectos/${proyectoId}/detalles`, {
      statusCode: 403,
      body: { error: 'Solo el creador puede editar los detalles' },
    }).as('guardarSinPermiso');

    cy.get('input#version').type('1.0.1');
    cy.get('select#plataforma').select('Windows');
    cy.get('textarea#instrucciones').type('Texto de prueba sin permisos.');
    cy.contains('button', 'Guardar detalles').click();

    cy.wait('@guardarSinPermiso');
    cy.contains('.detalles-error-general', 'Solo el creador puede editar los detalles').should('be.visible');
  });
});