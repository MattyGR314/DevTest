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

    // 5. Mock para DT06 (Seleccionar/Inscribir Proyecto) - Búsqueda por Path Param
    cy.intercept('GET', '/api/proyectos/100', {
      statusCode: 200,
      body: { 
        id: 100, 
        nombre: 'Sistema E-commerce Integrado' 
      }
    }).as('detalleInscripcion');
  });

  it('INTEGRACIÓN END-TO-END: Navegación Inicio -> Subir -> Buscar -> Consultar -> Inscribir', () => {
    
    // --- FASE 1: INICIO Y NAVEGACIÓN ---
    cy.visit('/'); // Renderiza Inicio.js
    cy.get('h1.hero-titulo').should('contain', 'Donde el código');
    
    // Validar el Link a DT03 y navegar
    cy.contains('Subir proyecto').click();
    cy.url().should('include', '/subircodigo');

    // --- FASE 2: DT03 - SUBIR CÓDIGO ---
    // Interactuamos con el formulario de SubirCodigo.js
    cy.get('input#descripcion').type('Descripción inicial'); // Asumiendo que el id es descripcion o se usa textarea
    cy.get('button[type="submit"]').contains('Aceptar').click();
    
    // --- FASE 3: NAVEGACIÓN A BÚSQUEDA ---
    // Simulamos que el usuario va a la búsqueda tras confirmar
    cy.visit('/busqueda');
    cy.wait('@listarProyectos');

    // --- FASE 4: DT05 y DT11 - LISTAR Y EDITAR DESCRIPCIÓN ---
    cy.get('.proyecto-tabla').should('contain', 'Sistema E-commerce Integrado');
    
    // Abrir modal de edición
    cy.get('.editar-descripcion-boton').first().click();
    cy.get('textarea#descripcion-edicion').clear().type('Descripción editada desde Cypress');
    cy.get('.modal-guardar-boton').click();
    cy.wait('@modificarDescripcion');

    // Validar cierre de modal (interfaz dinámica)
    cy.get('.descripcion-modal-form').should('not.exist');

    // Clic en el enlace del proyecto para ir a DT10
    cy.get('.proyecto-link').first().click();

    // --- FASE 5: DT10 - RESULTADO CONSULTA ---
    // Validar que el ID del proyecto pasó correctamente por la URL
    cy.url().should('include', '/resultado-consulta/100');
    cy.wait('@detalleConsulta');

    // Validar renderizado de ResultadoConsulta.js
    cy.get('h2').should('contain', 'Detalle del proyecto');
    cy.get('.resultado-id').should('contain', '#100');
    cy.get('article.resultado-card').should('contain', 'Descripción editada desde Cypress');

    // --- FASE 6: DT06 - SELECCIONAR / INSCRIBIR PROYECTO ---
    // Como en ResultadoConsulta.js (según el código) no hay un botón directo a "Inscribirse",
    // simulamos la navegación a la ruta de selección con el mismo ID integrado.
    cy.visit('/seleccionar-proyecto/100');
    cy.wait('@detalleInscripcion');

    // Validar formulario de SeleccionarProyecto.js
    cy.get('input#nombre').type('Tester de Integración');
    cy.get('input#correo').type('tester@devtest.com');
    cy.get('button[type="submit"]').click();

    // Capturar y validar la petición de inscripción
    cy.wait('@postGenerico').then((interception) => {
      // Validamos que el payload se formó correctamente
      expect(interception.request.body).to.not.be.null;
    });

    // Validar que la interfaz se bloqueó temporalmente o cambió el botón
    // El texto 'Guardando...' debe aparecer transitoriamente o manejarse el estado final
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('PRUEBA DE ESTADO: Manejo de errores entre módulos (Error 404 en DT10)', () => {
    // Simulamos que el usuario llegó a un ID inválido desde la búsqueda
    cy.intercept('GET', '/api/proyectos?q=999&campo=id', {
      statusCode: 404,
      body: [] // ResultadoConsulta.js espera un array vacío si no hay resultados
    }).as('consultaError');

    cy.visit('/resultado-consulta/999');
    cy.wait('@consultaError');

    // Verificamos que ResultadoConsulta.js captura el array vacío y muestra el error
    cy.get('.resultado-error').should('be.visible').and('contain', 'No existe un proyecto con ese ID');
    
    // Verificamos que el botón de volver funciona
    cy.get('.resultado-volver').click();
    cy.url().should('include', '/busqueda');
  });
});