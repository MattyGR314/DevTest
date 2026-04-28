/// <reference types="cypress" />

describe('INTEGRACION: DT_17 - Consultar detalles del proyecto', () => {
  const visitResultadoConsulta = (projectId) => {
    cy.visit(`/resultado-consulta/${projectId}`);
  };

  const buildProyecto = (overrides = {}) => ({
    id: 1701,
    nombre: 'Proyecto Integracion DT17',
    correo: 'dev@devtest.com',
    descripcion: 'Descripcion de integracion para DT17',
    fecha_creacion: '2026-04-20T12:00:00Z',
    fecha_limite: '2026-05-20T12:00:00Z',
    num_testers: 4,
    nombre_fichero: 'app.exe',
    archivo_path: null,
    ...overrides,
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // DT_1_1: Proyecto registrado con detalles muestra fecha limite y numero de testers
  it('DT_1_1: Muestra fecha limite y numero de testers cuando el proyecto existe', () => {
    const proyecto = buildProyecto({
      id: 1701,
      fecha_limite: '2024-12-31T12:00:00Z',
      num_testers: 5,
    });

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(proyecto.id)}`, {
      statusCode: 200,
      body: proyecto,
    }).as('getProyecto');

    visitResultadoConsulta(proyecto.id);
    cy.wait('@getProyecto');

    cy.contains('strong', 'Fecha límite:').parent().should('contain', '31/12/2024');
    cy.contains('strong', 'Número de testers:').parent().should('contain', '5');
    cy.get('.resultado-error').should('not.exist');
  });

  // DT_1_2: Proyecto no registrado notifica error de no encontrado
  it('DT_1_2: Muestra mensaje cuando el proyecto no esta registrado', () => {
    const projectId = 1799;

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' },
    }).as('getProyectoNoExiste');

    visitResultadoConsulta(projectId);
    cy.wait('@getProyectoNoExiste');

    cy.get('.resultado-error').should('be.visible').and('contain', 'Proyecto no encontrado');
    cy.get('.resultado-card').should('not.exist');
  });

  // DT_1_3: Proyecto registrado sin detalles notifica ausencia de detalles
  it('DT_1_3: Muestra placeholders cuando el proyecto no tiene detalles', () => {
    const proyecto = buildProyecto({
      id: 1703,
      fecha_limite: null,
      num_testers: null,
    });

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(proyecto.id)}`, {
      statusCode: 200,
      body: proyecto,
    }).as('getProyectoSinDetalles');

    visitResultadoConsulta(proyecto.id);
    cy.wait('@getProyectoSinDetalles');

    cy.contains('strong', 'Fecha límite:').parent().should('contain', 'Fecha no disponible');
    cy.contains('strong', 'Número de testers:').parent().should('contain', 'No especificado');
    cy.get('.resultado-error').should('not.exist');
  });

  // DT_2_1: Numero de testers en cero se muestra como 0
  it('DT_2_1: Muestra cero testers cuando num_testers es 0', () => {
    const proyecto = buildProyecto({
      id: 1720,
      num_testers: 0,
    });

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(proyecto.id)}`, {
      statusCode: 200,
      body: proyecto,
    }).as('getProyectoCeroTesters');

    visitResultadoConsulta(proyecto.id);
    cy.wait('@getProyectoCeroTesters');

    cy.contains('strong', 'Número de testers:').parent().should('contain', '0');
  });

  // DT_2_2: Formato de fecha limite en locale es-ES
  it('DT_2_2: Formatea fecha limite en formato local es-ES', () => {
    const proyecto = buildProyecto({
      id: 1721,
      fecha_limite: '2024-11-30T12:00:00Z',
    });

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(proyecto.id)}`, {
      statusCode: 200,
      body: proyecto,
    }).as('getProyectoFormatoFecha');

    visitResultadoConsulta(proyecto.id);
    cy.wait('@getProyectoFormatoFecha');

    cy.contains('strong', 'Fecha límite:').parent().should('contain', '30/11/2024');
  });

  // DT_3_1: Estado de carga visible antes de renderizar el detalle
  it('DT_3_1: Muestra estado de carga mientras llega el detalle', () => {
    const proyecto = buildProyecto({ id: 1731 });

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(proyecto.id)}`, {
      delay: 1200,
      statusCode: 200,
      body: proyecto,
    }).as('getProyectoLento');

    visitResultadoConsulta(proyecto.id);

    cy.contains('.resultado-info', 'Cargando proyecto...').should('be.visible');
    cy.wait('@getProyectoLento');
    cy.contains('.resultado-info', 'Cargando proyecto...').should('not.exist');
    cy.get('.resultado-card').should('be.visible');
  });

  // DT_3_2: Error de backend devuelve mensaje controlado
  it('DT_3_2: Notifica error cuando el backend responde 500', () => {
    const projectId = 1750;

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 500,
      body: { error: 'Error interno' },
    }).as('getProyectoError');

    visitResultadoConsulta(projectId);
    cy.wait('@getProyectoError');

    cy.get('.resultado-error').should('be.visible').and('contain', 'Proyecto no encontrado');
    cy.get('.resultado-card').should('not.exist');
  });

  // DT_3_3: Respuesta 200 sin datos notifica ID inexistente
  it('DT_3_3: Notifica que el proyecto no existe cuando la respuesta es nula', () => {
    const projectId = 1751;

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 200,
      body: null,
    }).as('getProyectoNulo');

    visitResultadoConsulta(projectId);
    cy.wait('@getProyectoNulo');

    cy.get('.resultado-error').should('be.visible').and('contain', 'No existe un proyecto con ese ID.');
    cy.get('.resultado-card').should('not.exist');
  });

  // DT_4_1: Flujo integrado desde Busqueda hacia detalle
  it('DT_4_1: Permite navegar desde Busqueda y ver detalles del proyecto', () => {
    const proyectoNombre = 'Proyecto Integracion DT17';
    const proyectoBusqueda = buildProyecto({
      id: 1761,
      nombre: proyectoNombre,
      fecha_limite: '2025-02-15T12:00:00Z',
      num_testers: 7,
    });

    cy.intercept({
      method: 'GET',
      pathname: '/api/proyectos',
    }, (req) => {
      if (req.query && req.query.q === proyectoNombre && req.query.campo === 'nombre') {
        req.reply({ statusCode: 200, body: [proyectoBusqueda] });
      } else {
        req.reply({ statusCode: 200, body: [] });
      }
    }).as('getProyectos');

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(proyectoBusqueda.id)}`, {
      statusCode: 200,
      body: proyectoBusqueda,
    }).as('getDetalle');

    cy.visit('/busqueda');
    cy.wait('@getProyectos');

    cy.get('select.busqueda-select').select('nombre');
    cy.get('input.busqueda-input').clear().type(proyectoNombre, { delay: 0 });
    cy.get('button.busqueda-boton').click();

    cy.wait('@getProyectos');
    cy.contains('a.proyecto-card-link', proyectoNombre).should('be.visible').click();

    cy.wait('@getDetalle');
    cy.url().should('include', `/resultado-consulta/${proyectoBusqueda.id}`);
    cy.contains('strong', 'Fecha límite:').parent().should('contain', '15/2/2025');
    cy.contains('strong', 'Número de testers:').parent().should('contain', '7');
  });
});
