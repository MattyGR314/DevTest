describe('DT_05 - Listar Proyectos Registrados', () => {

  // Antes de cada prueba ajustamos la resolución para tener un entorno consistente
  beforeEach(() => {
    cy.viewport(1280, 720);
  });

  // =========================================================================
  // CRITERIOS DE ACEPTACIÓN PRINCIPALES
  // =========================================================================

  it('DT_05_1: Mostrar lista de proyectos en orden cuando existen registros', () => {
    // 1. Mockeamos la respuesta de la API con datos simulados
    const mockProyectos = [
      { 
        id: 2, 
        nombre: 'Proyecto Beta', 
        correo: 'beta@test.com', 
        fecha_creacion: '2026-03-26T12:00:00Z', 
        descripcion: 'Segunda subida',
        archivo_path: 'uploads/archivo_beta.exe'
      },
      { 
        id: 1, 
        nombre: 'Proyecto Alpha', 
        correo: 'alpha@test.com', 
        fecha_creacion: '2026-03-25T10:00:00Z', 
        descripcion: 'Primera subida',
        archivo_path: 'uploads/archivo_alpha.exe'
      }
    ];

    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: mockProyectos
    }).as('getProyectosConDatos');

    // 2. Navegamos a la ruta
    cy.visit('/busqueda');

    // 3. Esperamos a que la petición termine
    cy.wait('@getProyectosConDatos');

    // 4. Verificaciones
    cy.get('.resultados-list').should('exist');
    cy.get('.proyecto-tabla').should('have.length', 2);

    // Verificamos el orden exacto de renderizado
    cy.get('.proyecto-tabla').eq(0).find('h3').should('have.text', 'Proyecto Beta');
    cy.get('.proyecto-tabla').eq(1).find('h3').should('have.text', 'Proyecto Alpha');
  });

  it('DT_05_2: Notificar la ausencia de proyectos si no hay registros', () => {
    // 1. Simulamos una base de datos vacía
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: [] 
    }).as('getProyectosVacios');

    // 2. Navegamos a la ruta
    cy.visit('/busqueda');

    // 3. Esperamos a que la petición termine
    cy.wait('@getProyectosVacios');

    // 4. Verificaciones
    cy.get('.proyecto-tabla').should('not.exist');
    
    // (Recuerda quitar el "&& termino" en Busqueda.js para que este test pase al inicio)
    cy.get('.no-resultados')
      .should('be.visible')
      .and('contain.text', 'No se encontraron proyectos');
  });

  // =========================================================================
  // PRUEBAS ADICIONALES (ROBUSTEZ Y CASOS DE ERROR)
  // =========================================================================

  it('DT_05_3: Mostrar estado de carga mientras se obtienen los datos', () => {
    // Añadimos un "delay" artificial de 1 segundo (1000ms) a la respuesta
    cy.intercept('GET', '/api/proyectos*', {
      delay: 1000,
      statusCode: 200,
      body: []
    }).as('getProyectosLento');

    cy.visit('/busqueda');

    // Comprobamos que el mensaje de carga aparece INMEDIATAMENTE al entrar
    cy.get('.cargando')
      .should('be.visible')
      .and('contain.text', 'Cargando proyectos...');

    // Esperamos a que la petición termine
    cy.wait('@getProyectosLento');

    // Comprobamos que el mensaje de carga desaparece
    cy.get('.cargando').should('not.exist');
  });

  it('DT_05_4: Mostrar mensaje de error adecuado si el servidor falla (Error 500)', () => {
    // Simulamos un error interno del servidor
    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 500,
      body: { error: 'Error interno en la base de datos' }
    }).as('getProyectosError');

    cy.visit('/busqueda');
    cy.wait('@getProyectosError');

    // Verificamos que se renderiza el contenedor de error de tu frontend
    cy.get('.error-mensaje')
      .should('be.visible')
      // React y fetch lanzarán el error de tu bloque catch ('Error al cargar proyectos')
      .and('contain.text', 'Error al cargar proyectos');
      
    // Comprobamos que no se renderizan listas ni estados de carga
    cy.get('.cargando').should('not.exist');
    cy.get('.proyecto-tabla').should('not.exist');
  });

  it('DT_05_5: Renderizar correctamente proyectos con datos incompletos (sin descripción ni archivo)', () => {
    // Simulamos un proyecto al que le faltan datos opcionales
    const mockProyectoIncompleto = [{ 
      id: 3, 
      nombre: 'Proyecto Sin Detalles', 
      correo: 'nodetails@test.com', 
      fecha_creacion: '2026-03-26T15:00:00Z', 
      // Faltan intencionalmente: descripcion, description y archivo_path
    }];

    cy.intercept('GET', '/api/proyectos*', {
      statusCode: 200,
      body: mockProyectoIncompleto
    }).as('getProyectoIncompleto');

    cy.visit('/busqueda');
    cy.wait('@getProyectoIncompleto');

    // El proyecto debe existir
    cy.get('.proyecto-tabla').should('have.length', 1);
    cy.get('.proyecto-tabla').find('h3').should('have.text', 'Proyecto Sin Detalles');

    // No debe explotar la interfaz, y no deben renderizarse los campos faltantes
    cy.contains('Descripción:').should('not.exist');
    cy.get('.descarga-link').should('not.exist');
  });

});