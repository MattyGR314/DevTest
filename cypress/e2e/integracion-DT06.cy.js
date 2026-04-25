/* global cy */
describe('Pruebas de Integración - Flujo Principal (Sin Autenticación)', () => {

  beforeEach(() => {
    // ==========================================
    // CONFIGURACIÓN DE STUBS (MOCKS) DEL BACKEND
    // Aislando el Frontend para probar solo las interfaces entre componentes
    // ==========================================

    // 1. Mock para DT03 (Subir Proyecto) - Asumiendo que hace POST a /api/proyectos o similar
    cy.intercept('POST', '**/api/**', {
      statusCode: 201,
      body: { message: 'Operación exitosa', id: 100 }
    }).as('postGenerico');

    // 2. Mock para DT05 (Búsqueda) - Lista general de proyectos
    cy.intercept('GET', '/api/proyectos', {
      statusCode: 200,
      body: [
        { 
          id: 100, 
          nombre: 'Sistema E-commerce Integrado', 
          correo: 'dev@test.com', 
          descripcion: 'Descripción inicial',
          fecha_creacion: '2026-06-15T10:00:00Z'
        }
      ]
    }).as('listarProyectos');

    // 3. Mock para DT11 (Editar Descripción en Búsqueda)
    cy.intercept('PUT', '**/descripcion', {
      statusCode: 200,
      body: { mensaje: 'Descripción actualizada exitosamente' }
    }).as('modificarDescripcion');

    // 4. Mock para DT10 (Resultado Consulta) - Búsqueda por ID con Query Params
    cy.intercept('GET', '/api/proyectos?q=100&campo=id', {
      statusCode: 200,
      body: [
        { 
          id: 100, 
          nombre: 'Sistema E-commerce Integrado', 
          correo: 'dev@test.com', 
          descripcion: 'Descripción editada desde Cypress',
          nombre_fichero: 'ecommerce.exe',
          fecha_creacion: '2026-06-15T10:00:00Z'
        }
      ]
    }).as('detalleConsulta');

    // 5. Mock para DT06 (Seleccionar/Inscribir Proyecto) - Usando comodines
	cy.intercept('GET', '**/api/proyectos/100*', {
      statusCode: 200,
      body: { 
        id: 100, 
        nombre: 'Sistema E-commerce Integrado' 
      }
    }).as('detalleInscripcion');
  });

  it('INTEGRACIÓN END-TO-END: Navegación Inicio -> Subir -> Buscar -> Consultar -> Inscribir', () => {
    
    // --- FASE 1: INICIO Y NAVEGACIÓN ---
    cy.visit('/'); 
    cy.get('h1.hero-titulo').should('contain', 'Donde el código');
    
    cy.contains('Subir proyecto').click();
    cy.url().should('include', '/subircodigo');

    // --- FASE 2: DT03 - SUBIR CÓDIGO ---
    cy.get('textarea#descripcion').type('Descripción inicial'); 
    cy.get('button[type="submit"]').contains('Aceptar').click();
    
    // --- FASE 3: NAVEGACIÓN A BÚSQUEDA ---
    cy.visit('/busqueda');
    cy.wait('@listarProyectos');

    // --- FASE 4: DT05 y DT11 - LISTAR Y EDITAR DESCRIPCIÓN ---
    cy.get('.proyecto-card').should('contain', 'Sistema E-commerce Integrado');
    
    cy.get('.editar-descripcion-boton').first().click();
    cy.get('textarea#descripcion-edicion').clear().type('Descripción editada desde Cypress');
    cy.get('.modal-guardar-boton').click();
    cy.wait('@modificarDescripcion');

    cy.get('.descripcion-modal-form').should('not.exist');

    cy.get('.proyecto-link').first().click();

    // --- FASE 5: DT10 - RESULTADO CONSULTA ---
    cy.url().should('include', '/resultado-consulta/100');
    cy.wait('@detalleConsulta');

    cy.get('h2').should('contain', 'Detalle del proyecto');
    cy.get('.resultado-id').should('contain', '#100');
    cy.get('article.resultado-card').should('contain', 'Descripción editada desde Cypress');

    // --- FASE 6: DT06 - SELECCIONAR / INSCRIBIR PROYECTO ---
    cy.visit('/seleccionarproyecto/100');
    cy.wait('@detalleInscripcion');

    cy.get('input#nombre').type('Tester de Integración');
    cy.get('input#correo').type('tester@devtest.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@postGenerico').then((interception) => {
      expect(interception.request.body).to.not.be.null;
    });

    // Verificamos que el flujo culminó mostrando el mensaje de éxito al usuario
    cy.get('.success-message')
      .should('be.visible')
      .and('contain', '¡Inscripción guardada exitosamente!');
  });

  it('PRUEBA DE ESTADO: Manejo de errores entre módulos (Error 404 en DT10)', () => {
    // Simulamos que el usuario llegó a un ID inválido desde la búsqueda y el servidor da error
    // Cambiar la ruta interceptada:
    cy.intercept('GET', '/api/proyectos/999', {
      statusCode: 404,
      body: { error: 'Proyecto no encontrado' }
    }).as('consultaError');

    cy.visit('/resultado-consulta/999');
    
    cy.wait('@consultaError');

    cy.get('.resultado-error').should('be.visible').and('contain', 'No se pudo obtener el proyecto');
    
    cy.get('.resultado-volver').click();
    cy.url().should('include', '/busqueda');
  });
  
});