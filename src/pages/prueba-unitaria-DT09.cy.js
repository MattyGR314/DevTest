describe('Integración DT09 - Obtener feedback de un proyecto', () => {
  const projectId = 1;
  const urlFeedback = `/proyecto/${projectId}/ver-feedback`;
  const apiEndpoint = `/api/proyectos/${projectId}/feedback`;

  beforeEach(() => {
    // Limpiar el estado antes de cada prueba
    cy.clearLocalStorage();
  });

  it('Debe solicitar inicio de sesión si no hay usuario autenticado (401)', () => {
    // Al no establecer datos en el AuthContext, el componente detecta falta de sesión
    cy.visit(urlFeedback);
    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'Debes iniciar sesión para ver el feedback.');
  });

  it('Debe denegar el acceso (403) si el usuario autenticado no es el creador del proyecto', () => {
    // Simulamos un usuario logueado en localStorage (ajustar según el AuthContext real)
    cy.window().then((win) => {
      win.localStorage.setItem('usuario', 'tester@ejemplo.com');
    });

    cy.intercept('GET', apiEndpoint, {
      statusCode: 403,
      body: { error: 'Solo los dueños del proyecto pueden ver el feedback' }
    }).as('getFeedbackDenegado');

    cy.visit(urlFeedback);
    cy.wait('@getFeedbackDenegado');

    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'No eres el dueño de este proyecto');
  });

  it('Debe mostrar error (404) si el proyecto consultado no existe', () => {
    cy.window().then((win) => win.localStorage.setItem('usuario', 'dueno@ejemplo.com'));

    cy.intercept('GET', apiEndpoint, {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' }
    }).as('getFeedbackNoEncontrado');

    cy.visit(urlFeedback);
    cy.wait('@getFeedbackNoEncontrado');

    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'El proyecto no existe.');
  });

  it('Debe informar cuando el proyecto existe pero no tiene feedback registrado (200 vacío)', () => {
    cy.window().then((win) => win.localStorage.setItem('usuario', 'dueno@ejemplo.com'));

    cy.intercept('GET', apiEndpoint, {
      statusCode: 200,
      body: []
    }).as('getFeedbackVacio');

    cy.visit(urlFeedback);
    cy.wait('@getFeedbackVacio');

    cy.get('.feedback-error-general')
      .should('be.visible')
      .and('contain.text', 'No hay feedback registrado para este proyecto.');
  });

  it('Debe renderizar correctamente la lista de feedback (200 con datos)', () => {
    cy.window().then((win) => win.localStorage.setItem('usuario', 'dueno@ejemplo.com'));

    const mockData = [
      {
        id: 1,
        correo: 'tester@ejemplo.com',
        nombre_usuario: 'Juan Tester',
        texto: 'He encontrado un bug en la validación de correos.',
        archivo_path: '123456-bug.png',
        nombre_fichero: 'bug.png',
        fecha_creacion: '2026-04-25T10:00:00Z'
      }
    ];

    cy.intercept('GET', apiEndpoint, {
      statusCode: 200,
      body: mockData
    }).as('getFeedbackExito');

    cy.visit(urlFeedback);
    cy.wait('@getFeedbackExito');

    // Validar el renderizado de la lista
    cy.get('.feedback-lista').should('exist');
    cy.get('.feedback-item').should('have.length', 1);
    cy.get('.feedback-meta').should('contain.text', 'Juan Tester');
    cy.get('.feedback-texto').should('contain.text', 'He encontrado un bug');
    cy.get('.feedback-archivo a')
      .should('have.attr', 'href', '/uploads/123456-bug.png')
      .and('contain.text', 'bug.png');
  });
});