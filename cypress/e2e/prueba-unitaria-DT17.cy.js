/// <reference types="cypress" />

describe('DT_17 - Consulta de detalles del proyecto', () => {
  const visitResultadoConsultaWithFallback = (projectId) => {
    cy.visit(`/resultado-consulta/${projectId}`, { failOnStatusCode: false });
    cy.get('body').then(($body) => {
      const altBaseUrl = Cypress.env('ALT_BASE_URL');
      if ($body.find('.resultado-consulta').length === 0 && altBaseUrl) {
        cy.visit(`${altBaseUrl}/resultado-consulta/${projectId}`);
      }
    });
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('DT_17_1: Cuando un developer consulta un proyecto registrado con detalles, muestra fecha límite y número de testers', () => {
    const projectId = 'proyecto-1';
    const projectData = {
      id: projectId,
      nombre: 'Proyecto de Testing',
      correo: 'developer@devtest.com',
      descripcion: 'Descripción del proyecto',
      fecha_creacion: '2024-01-15',
      fecha_limite: '2024-12-31',
      num_testers: 5,
      nombre_fichero: 'proyecto.exe',
      archivo_path: null
    };

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 200,
      body: projectData
    }).as('getProyecto');

    visitResultadoConsultaWithFallback(projectId);

    cy.wait('@getProyecto');

    // Verificar que se muestra la fecha límite
    cy.contains('strong', 'Fecha límite:').parent().should('contain', '31/12/2024');

    // Verificar que se muestra el número de testers
    cy.contains('strong', 'Número de testers:').parent().should('contain', '5');

    // Verificar que se muestra el nombre del proyecto
    cy.get('.resultado-card').should('contain', 'Proyecto de Testing');

    // Verificar que NO se muestra un mensaje de error
    cy.get('.resultado-error').should('not.exist');
  });

  it('DT_17_2: Cuando un developer consulta un proyecto no registrado, se notifica que no se encuentra registrado', () => {
    const projectId = 'proyecto-no-existe';

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' }
    }).as('getProyectoNoEncontrado');

    visitResultadoConsultaWithFallback(projectId);

    cy.wait('@getProyectoNoEncontrado');

    // Verificar que se muestra el mensaje de error
    cy.get('.resultado-error').should('be.visible').and('contain', 'Proyecto no encontrado');

    // Verificar que NO se muestra la tarjeta del proyecto
    cy.get('.resultado-card').should('not.exist');
  });

  it('DT_17_3: Cuando un developer consulta un proyecto registrado sin detalles, se notifica que no tiene detalles', () => {
    const projectId = 'proyecto-sin-detalles';
    const projectData = {
      id: projectId,
      nombre: 'Proyecto sin Detalles',
      correo: 'developer@devtest.com',
      descripcion: 'Descripción disponible',
      fecha_creacion: '2024-01-15',
      fecha_limite: null,
      num_testers: null,
      nombre_fichero: null,
      archivo_path: null
    };

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 200,
      body: projectData
    }).as('getProyectoSinDetalles');

    visitResultadoConsultaWithFallback(projectId);

    cy.wait('@getProyectoSinDetalles');

    // Verificar que se muestra la tarjeta del proyecto
    cy.get('.resultado-card').should('be.visible');

    // Verificar que se muestra "Fecha no disponible" cuando fecha_limite es null
    cy.contains('strong', 'Fecha límite:').parent().should('contain', 'Fecha no disponible');

    // Verificar que se muestra "No especificado" cuando num_testers es null
    cy.contains('strong', 'Número de testers:').parent().should('contain', 'No especificado');

    // Verificar que NO se muestra un mensaje de error
    cy.get('.resultado-error').should('not.exist');
  });

  it('DT_17_1_Extended: Verifica que todos los detalles se muestren correctamente cuando están disponibles', () => {
    const projectId = 'proyecto-completo';
    const projectData = {
      id: projectId,
      nombre: 'Proyecto Completo',
      correo: 'dev@devtest.com',
      descripcion: 'Este es un proyecto con todos los detalles disponibles',
      fecha_creacion: '2024-03-20',
      fecha_limite: '2024-09-15',
      num_testers: 8,
      nombre_fichero: 'app.exe',
      archivo_path: 'uploads/archivo.exe'
    };

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 200,
      body: projectData
    }).as('getProyectoCompleto');

    visitResultadoConsultaWithFallback(projectId);

    cy.wait('@getProyectoCompleto');

    // Verificar que aparece el ID del proyecto
    cy.get('.resultado-id').should('contain', `Proyecto #${projectId}`);

    // Verificar que se muestra el nombre
    cy.get('.resultado-card h3').should('contain', 'Proyecto Completo');

    // Verificar que se muestra la fecha de creación
    cy.contains('strong', 'Fecha de creación:').parent().should('contain', '20/3/2024');

    // Verificar que se muestra la fecha límite
    cy.contains('strong', 'Fecha límite:').parent().should('contain', '15/9/2024');

    // Verificar que se muestra el número de testers correcto
    cy.contains('strong', 'Número de testers:').parent().should('contain', '8');

    // Verificar que aparece el botón "Volver a búsqueda"
    cy.get('.resultado-volver').should('be.visible').and('contain', 'Volver a búsqueda');
  });

  it('DT_17_2_Extended: Verifica el manejo de proyectos con datos inválidos', () => {
    const projectId = 'proyecto-invalido';

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 200,
      body: null
    }).as('getProyectoInvalido');

    visitResultadoConsultaWithFallback(projectId);

    cy.wait('@getProyectoInvalido');

    // Verificar que se muestra el mensaje de error apropiado
    cy.get('.resultado-error').should('be.visible').and('contain', 'No existe un proyecto con ese ID');

    // Verificar que NO se muestra la tarjeta del proyecto
    cy.get('.resultado-card').should('not.exist');
  });

  it('DT_17_3_Extended: Verifica que el proyecto sin fecha límite muestre información clara', () => {
    const projectId = 'proyecto-sin-fecha';
    const projectData = {
      id: projectId,
      nombre: 'Proyecto Sin Fecha Límite',
      correo: 'developer@test.com',
      descripcion: 'Un proyecto sin fecha límite definida',
      fecha_creacion: '2024-02-10',
      fecha_limite: null,
      num_testers: 3,
      nombre_fichero: 'proyecto.zip',
      archivo_path: null
    };

    cy.intercept('GET', `/api/proyectos/${encodeURIComponent(projectId)}`, {
      statusCode: 200,
      body: projectData
    }).as('getProyectoSinFecha');

    visitResultadoConsultaWithFallback(projectId);

    cy.wait('@getProyectoSinFecha');

    // Verificar que se muestra la tarjeta del proyecto
    cy.get('.resultado-card').should('be.visible');

    // Verificar que fecha_limite muestra "Fecha no disponible"
    cy.contains('strong', 'Fecha límite:').parent().should('contain', 'Fecha no disponible');

    // Pero verifica que SÍ muestra el número de testers si está disponible
    cy.contains('strong', 'Número de testers:').parent().should('contain', '3');
  });
});
