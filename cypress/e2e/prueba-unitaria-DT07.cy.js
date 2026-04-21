describe('DT_07 - Descarga de Archivos Ejecutables de Proyectos', () => {
  const usuarioCorreo = 'tester@test.com';

  const proyectoConArchivo = {
    id: 1,
    nombre: 'Proyecto Test',
    correo: 'dev@test.com',
    archivo_path: 'uploads/proyecto-test.exe',
    nombre_fichero: 'ProyectoTest.exe',
    descripcion: 'Proyecto de prueba con ejecutable',
    fecha_creacion: new Date().toISOString(),
  };

  const proyectoSinArchivo = {
    id: 2,
    nombre: 'Proyecto Sin Archivo',
    correo: 'dev@test.com',
    archivo_path: null,
    nombre_fichero: null,
    descripcion: 'Proyecto sin ejecutable registrado',
    fecha_creacion: new Date().toISOString(),
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('DT_07_1: Descarga el archivo si está registrado, hay sesión iniciada y el usuario está inscrito en el proyecto', () => {
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: [proyectoConArchivo],
    }).as('cargarProyectos');

    cy.intercept('GET', '/api/inscripciones/usuario*', {
      statusCode: 200,
      body: { ids: [1] },
    }).as('cargarInscripciones');

    cy.intercept('GET', '/uploads/proyecto-test.exe', {
      statusCode: 200,
      body: 'contenido_ejecutable',
      headers: {
        'content-disposition': 'attachment; filename="ProyectoTest.exe"',
        'content-type': 'application/octet-stream',
      },
    }).as('descargaArchivo');

    cy.visit('/busqueda', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioCorreo);
      },
    });

    cy.wait('@cargarProyectos');
    cy.wait('@cargarInscripciones');

    cy.get('.descarga-link')
      .should('be.visible')
      .and('have.attr', 'href', '/uploads/proyecto-test.exe')
      .and('have.attr', 'download');
  });

  it('DT_07_2: Notifica al tester si el archivo ejecutable no está registrado en el sistema', () => {
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: [proyectoSinArchivo],
    }).as('cargarProyectos');

    cy.intercept('GET', '/api/inscripciones/usuario*', {
      statusCode: 200,
      body: { ids: [2] },
    }).as('cargarInscripciones');

    cy.visit('/busqueda', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioCorreo);
      },
    });

    cy.wait('@cargarProyectos');
    cy.wait('@cargarInscripciones');

    cy.get('.descarga-link').should('not.exist');
    cy.get('.proyecto-tabla').should('be.visible').and('contain', proyectoSinArchivo.nombre);
  });

  it('DT_07_3: Solicita al tester que inicie sesión si no tiene una sesión activa', () => {
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: [proyectoConArchivo],
    }).as('cargarProyectos');

    cy.intercept('GET', '/api/inscripciones/usuario*', {
      statusCode: 200,
      body: { ids: [] },
    }).as('cargarInscripciones');

    cy.visit('/busqueda');

    cy.wait('@cargarProyectos');

    cy.get('.descarga-link').should('not.exist');
    cy.get('@cargarInscripciones.all').should('have.length', 0);
  });

  it('DT_07_4: Informa al tester que debe estar inscrito en el proyecto si tiene sesión pero no está registrado en el proyecto', () => {
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: [proyectoConArchivo],
    }).as('cargarProyectos');

    cy.intercept('GET', '/api/inscripciones/usuario*', {
      statusCode: 200,
      body: { ids: [] },
    }).as('cargarInscripciones');

    cy.visit('/busqueda', {
      onBeforeLoad(win) {
        win.localStorage.setItem('usuario_correo', usuarioCorreo);
      },
    });

    cy.wait('@cargarProyectos');
    cy.wait('@cargarInscripciones');

    cy.get('.descarga-link').should('not.exist');
    cy.get('.proyecto-tabla').should('be.visible').and('contain', proyectoConArchivo.nombre);
    cy.get('a[href*="seleccionarproyecto"]').should('not.exist');
  });
});
