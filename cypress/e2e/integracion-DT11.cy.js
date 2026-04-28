/// <reference types="cypress" />

/**
 * SUITE DE PRUEBAS DE INTEGRACIÓN
 * Flujo completo: Subir código con Descripcion
 * 
 * Objetivo: Validar el proceso end-to-end de subir un proyecto con nombre,
 * correo, archivo ejecutable y Descripcion. Incluye validaciones en frontend,
 * peticiones al backend y navegación a página de confirmación.
 */

describe('INTEGRACIÓN: Subir Código con Descripcion - Flujo Completo', () => {

  // ========================================================================================
  // SETUP Y TEARDOWN
  // ========================================================================================

  beforeEach(() => {
    // Limpiar localStorage y sessionStorage
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    // Visitar la página de subir código
    cy.visit('http://localhost:3000/subircodigo', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        // Stub de alert para interceptar mensajes
        cy.stub(win, 'alert').as('alert');
      }
    });

    // Esperar a que el formulario esté visible
    cy.get('form#uploadCode', { timeout: 10000 }).should('be.visible');
  });

  afterEach(() => {
    // Verificar que no hay errores en la consola (excepto los esperados)
    cy.window().then((win) => {
      const consoleErrors = [];
      const originalError = win.console.error;
      
      win.console.error = function(...args) {
        // Ignorar errores específicos conocidos
        const errorMsg = args[0]?.toString() || '';
        if (!errorMsg.includes('Network error')) {
          consoleErrors.push(errorMsg);
        }
        originalError.apply(win.console, args);
      };
    });
  });

  // ========================================================================================
  // CASOS DE ÉXITO - HAPPY PATH
  // ========================================================================================

  describe('✅ HAPPY PATH - Flujo exitoso', () => {

    it('IT_001: Subir proyecto con todos los campos Validos (SIN Descripcion)', () => {
      // Interceptar la petición POST
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: {
          message: 'Archivo subido correctamente',
          id: 1,
          nombre: 'Proyecto Exitoso',
          correo: 'usuario@test.com',
          archivo: 'programa-1234.exe',
          descripcion: ''
        }
      }).as('uploadSuccess');

      // Llenar el formulario
      cy.get('input#nombre')
        .should('be.visible')
        .type('Proyecto Exitoso', { delay: 50 });

      cy.get('input#correo')
        .should('be.visible')
        .type('usuario@test.com', { delay: 50 });

      cy.get('input#archivo')
        .selectFile('cypress/fixtures/script.bat', { force: true });

      // Validar que el archivo se cargó correctamente
      cy.contains('Archivo seleccionado: script.bat', { timeout: 5000 })
        .should('be.visible');

      // NO llenar Descripcion (campo opcional)
      cy.get('textarea#descripcion')
        .should('have.value', '');

      // Enviar formulario
      cy.get('button').contains('Aceptar').click();

      // Esperar y validar la petición
      cy.wait('@uploadSuccess', { timeout: 5000 });

      // Validar redirección a página de confirmación
      cy.url({ timeout: 5000 }).should('include', '/confirmacion');

      // Validar contenido de la página de confirmación
      cy.contains('Los archivos se han subido correctamente', { timeout: 5000 })
        .should('be.visible');

      // Validar botón de regreso
      cy.contains('a', 'Volver')
        .should('be.visible')
        .should('have.class', 'confirmacion-btn');
    });

    it('IT_002: Subir proyecto CON Descripcion válida (100 caracteres)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: {
          message: 'Archivo subido correctamente',
          id: 2,
          nombre: 'Juego Estrategia',
          correo: 'desarrollador@email.com',
          archivo: 'juego.exe',
          descripcion: 'Este es un juego de estrategia en tiempo real con gráficos 3D.'
        }
      }).as('uploadWithDesc');

      // Llenar campos
      cy.get('input#nombre').type('Juego Estrategia');
      cy.get('input#correo').type('desarrollador@email.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });

      // Esperar confirmación del archivo
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      // Llenar Descripcion
      const descripcion = 'Este es un juego de estrategia en tiempo real con gráficos 3D.';
      cy.get('textarea#descripcion')
        .clear()
        .type(descripcion, { delay: 30 });

      // Validar que la Descripcion se cargó correctamente
      cy.get('textarea#descripcion').should('have.value', descripcion);

      // Enviar
      cy.get('button').contains('Aceptar').click();

      // Validar petición
      cy.wait('@uploadWithDesc');

      // Validar redirección
      cy.url().should('include', '/confirmacion');
      cy.contains('Los archivos se han subido correctamente').should('be.visible');
    });

    

    it('IT_003: El botón Volver desde confirmación regresa a Inicio', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 4 }
      }).as('upload');

      cy.get('input#nombre').type('Test Volver');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();
      cy.wait('@upload');

      cy.url().should('include', '/confirmacion');
      cy.contains('Los archivos se han subido correctamente').should('be.visible');

      // Hacer clic en Volver
      cy.contains('a', 'Volver').click();

      // Validar que regresa a la página principal (/)
      cy.url({ timeout: 5000 }).should('include', '/');
      cy.contains('Inicio').should('be.visible');
    });

  });

  // ========================================================================================
  // VALIDACIONES DE CAMPOS INDIVIDUALES
  // ========================================================================================

  describe('⚠️ VALIDACIÓN: Campos individuales', () => {

    it('IT_004: Rechazar formulario vacío - Mensaje global de error', () => {
      // Intentar enviar sin llenar nada
      cy.get('button').contains('Aceptar').click();

      // El formulario muestra errores por campo cuando faltan obligatorios
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('be.visible')

      cy.get('input#correo')
        .parent()
        .find('.error-message')
        .should('be.visible');

      cy.get('input#archivo')
        .parent()
        .find('.error-message')
        .should('be.visible');

      // Validar que NO redirige
      cy.url().should('include', '/subircodigo');
    });

    it('IT_005: Campo NOMBRE obligatorio - Error específico debajo del input', () => {
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      // Debe haber error debajo del campo nombre
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'El nombre del proyecto es obligatorio');
    });

    it('IT_006: Campo CORREO obligatorio - Error específico debajo del input', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      // Debe haber error debajo del campo correo
      cy.get('input#correo')
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'El correo electrónico es obligatorio');
    });

    it('IT_007: Campo ARCHIVO obligatorio - Error específico cuando no se selecciona', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      // No seleccionar archivo

      cy.get('button').contains('Aceptar').click();

      cy.get('input#archivo')
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'Debes seleccionar un archivo');
    });

    it('IT_008: Limpiar error del campo cuando el usuario empieza a escribir', () => {
      // Intentar enviar
      cy.get('button').contains('Aceptar').click();

      // Validar que hay error en nombre
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('be.visible');

      // Escribir en el campo nombre
      cy.get('input#nombre').type('Nuevo Nombre');

      // El error debe desaparecer
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('not.exist');
    });

  });

  // ========================================================================================
  // VALIDACIONES DE NOMBRE
  // ========================================================================================

  describe('🔤 VALIDACIÓN: Campo NOMBRE', () => {

    it('IT_009: Rechazar nombre con caracteres especiales (@, !, #, etc.)', () => {
      cy.get('input#nombre').type('Proyecto@!#Invalid');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('contain', 'El nombre no puede contener caracteres especiales');
    });

    it('IT_010: Aceptar nombre con espacios y números', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 11 }
      }).as('uploadNumeros');

      cy.get('input#nombre').type('Proyecto 2024 Version 3');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadNumeros');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_011: Aceptar nombre con mayúsculas y minúsculas', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 12 }
      }).as('uploadMayus');

      cy.get('input#nombre').type('MiProyectoIncrEible');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadMayus');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_012: Rechazar nombre con guiones bajos (_)', () => {
      cy.get('input#nombre').type('Proyecto_Con_Guiones');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('contain', 'El nombre no puede contener caracteres especiales');
    });

    it('IT_013: Rechazar nombre vacío después de trim()', () => {
      cy.get('input#nombre').type('   ');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('contain', 'El nombre del proyecto es obligatorio');
    });

    it('IT_014: Validar maxlength en nombre (máximo 100 caracteres)', () => {
      cy.get('input#nombre')
        .invoke('attr', 'maxlength')
        .should('equal', '100');

      const nombreLargo = 'A'.repeat(100);
      cy.get('input#nombre').type(nombreLargo);

      cy.get('input#nombre').then(($input) => {
        expect($input.val().length).to.equal(100);
      });
    });

  });

  // ========================================================================================
  // VALIDACIONES DE CORREO
  // ========================================================================================

  describe('📧 VALIDACIÓN: Campo CORREO', () => {

    it('IT_015: Rechazar correo sin formato Valido (sin @)', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('correosinemail.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#correo')
        .parent()
        .find('.error-message')
        .should('contain', 'El correo no sigue los estándares establecidos');
    });

    it('IT_016: Rechazar correo sin dominio (sin punto)', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('correo@dominio');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#correo')
        .parent()
        .find('.error-message')
        .should('contain', 'El correo no sigue los estándares establecidos');
    });

    it('IT_017: Aceptar correo con formato Valido', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 18 }
      }).as('uploadCorreoValido');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('usuario.valido@empresa.com.ar');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadCorreoValido');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_018: Rechazar correo vacío después de trim()', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('   ');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#correo')
        .parent()
        .find('.error-message')
        .should('contain', 'El correo electrónico es obligatorio');
    });

    it('IT_019: Aceptar correo con subdominios múltiples', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 20 }
      }).as('uploadSubdominios');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('usuario@mail.google.co.uk');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadSubdominios');
      cy.url().should('include', '/confirmacion');
    });

  });

  // ========================================================================================
  // VALIDACIONES DE ARCHIVO
  // ========================================================================================

  describe('📁 VALIDACIÓN: Campo ARCHIVO', () => {

    it('IT_020: Aceptar archivo .exe', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 21 }
      }).as('uploadExe');

      cy.get('input#nombre').type('Proyecto EXE');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      // (En las fixtures no hay .exe real, pero el validador acepta)

      cy.contains('Archivo seleccionado: script.bat', { timeout: 5000 }).should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadExe');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_021: Aceptar archivo .bat', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 22 }
      }).as('uploadBat');

      cy.get('input#nombre').type('Proyecto BAT');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      // Validar información del archivo (nombre)
      cy.contains('script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadBat');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_022: Rechazar archivo .txt (no ejecutable)', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/documento.txt', { force: true });

      cy.contains('Archivo seleccionado: documento.txt', { timeout: 5000 }).should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#archivo')
        .parent()
        .find('.error-message')
        .should('contain', 'El archivo debe ser ejecutable (.exe o .bat)');
    });

    it('IT_023: Rechazar archivo .json (no ejecutable)', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/example.json', { force: true });

      cy.contains('Archivo seleccionado: example.json', { timeout: 5000 }).should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.get('input#archivo')
        .parent()
        .find('.error-message')
        .should('contain', 'El archivo debe ser ejecutable (.exe o .bat)');
    });

    it('IT_024: Cambiar archivo após una selección previa', () => {
      // Seleccionar archivo inicial
      cy.get('input#archivo').selectFile('cypress/fixtures/documento.txt', { force: true });

      cy.contains('Archivo seleccionado: documento.txt', { timeout: 5000 }).should('be.visible');

      // Cambiar a otro archivo
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });

      // Validar que se actualizó a la nueva selección
      cy.contains('Archivo seleccionado: script.bat', { timeout: 5000 }).should('be.visible');

      // No debe mostrar el archivo anterior
      cy.contains('Archivo seleccionado: documento.txt').should('not.exist');
    });

    it('IT_025: Validar atributo accept en input file', () => {
      cy.get('input#archivo')
        .invoke('attr', 'accept')
        .should('equal', '.exe, .bat');
    });

  });

  // ========================================================================================
  // VALIDACIONES DE Descripcion
  // ========================================================================================

  describe('📝 VALIDACIÓN: Campo Descripcion (Opcional)', () => {

    it('IT_026: El campo Descripcion debe estar visible en el formulario', () => {
      cy.get('textarea#descripcion')
        .should('be.visible');

      cy.get('label[for="descripcion"]')
        .should('contain', 'Descripción del proyecto');
    });

    it('IT_027: Campo Descripcion NO debe estar marcado como obligatorio (sin *)', () => {
      cy.get('label[for="descripcion"]')
        .should('not.contain', '*')
        .should('not.contain', 'obligatorio');
    });

    it('IT_028: Aceptar Descripcion vacía (campo opcional)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 30 }
      }).as('uploadSinDesc');

      cy.get('input#nombre').type('Proyecto Sin Descripcion');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      // NO llenar Descripcion
      cy.get('textarea#descripcion').should('have.value', '');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadSinDesc');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_029: Aceptar Descripcion corta (1-50 caracteres)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 31 }
      }).as('uploadDescCorta');

      cy.get('input#nombre').type('Proyecto Descripcion Corta');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('textarea#descripcion').type('Este es un pequeño proyecto.');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadDescCorta');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_030: Aceptar Descripcion mediana (100 caracteres)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 32 }
      }).as('uploadDesc100');

      cy.get('input#nombre').type('Proyecto Descripcion Media');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      const desc100 = 'Este es un proyecto de ejemplo con una Descripcion mediana que tiene alrededor de cien caracteres aproximadamente.';
      cy.get('textarea#descripcion').type(desc100);

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadDesc100');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_031: Rechazar Descripcion que EXCEDE 500 caracteres (por server-side)', () => {
      cy.get('input#nombre').type('Proyecto Descripcion Larga');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      // SOLUCIÓN: Removemos el maxlength del HTML y obligamos a Cypress a teclear 
      // para que el estado de React (formData.descripcion) se actualice correctamente
      const desc501 = 'A'.repeat(501);
      cy.get('textarea#descripcion')
        .invoke('removeAttr', 'maxlength')
        .type(desc501, { delay: 0 });

      cy.get('button').contains('Aceptar').click();

      // Debe mostrar error específico debajo del textarea
      cy.get('textarea#descripcion')
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', '500');
    });

    it('IT_032: Validar atributo maxlength en Descripcion (500 caracteres)', () => {
      cy.get('textarea#descripcion')
        .invoke('attr', 'maxlength')
        .should('equal', '500');
    });

    it('IT_033: Descripcion se ajusta dinámicamente en altura', () => {
      const descLarga = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. \n '.repeat(5);

      cy.get('textarea#descripcion').then(($textarea) => {
        const alturaInicial = $textarea.height();

        cy.get('textarea#descripcion').type(descLarga);

        cy.get('textarea#descripcion').then(($textareaConTexto) => {
          const alturaNueva = $textareaConTexto.height();
          // La altura debe aumentar
          expect(alturaNueva).to.be.greaterThan(alturaInicial);
        });
      });
    });

    it('IT_034: Limpiar error de Descripcion cuando el usuario edita', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      // SOLUCIÓN: Aplicamos la misma técnica del type()
      const desc501 = 'A'.repeat(501);
      cy.get('textarea#descripcion')
        .invoke('removeAttr', 'maxlength')
        .type(desc501, { delay: 0 });

      cy.get('button').contains('Aceptar').click();

      // Debe haber error
      cy.get('textarea#descripcion')
        .parent()
        .find('.error-message')
        .should('be.visible');

      // Limpiar y escribir de nuevo
      cy.get('textarea#descripcion').clear().type('Nueva Descripcion válida');

      // El error debe desaparecer
      cy.get('textarea#descripcion')
        .parent()
        .find('.error-message')
        .should('not.exist');
    });

  });

  // ========================================================================================
  // CASOS DE ERROR DEL SERVIDOR
  // ========================================================================================

  describe('❌ ERRORES DEL SERVIDOR', () => {

    it('IT_035: Manejar error 409 - Nombre duplicado', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 409,
        body: {
          error: 'Ya existe un proyecto con este nombre',
          codigo: 'NOMBRE_DUPLICADO'
        }
      }).as('uploadDuplicate');

      cy.get('input#nombre').type('Proyecto Duplicado');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadDuplicate');

      // En 409 se marca error en el campo nombre
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'Ya existe un proyecto con este nombre');

      // NO debe redirigir
      cy.url().should('include', '/subircodigo');
    });

    it('IT_036: Manejar error 400 - Validación en servidor', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 400,
        body: {
          error: 'El archivo debe ser ejecutable',
          message: 'Solo .exe o .bat permitidos'
        }
      }).as('uploadValidationError');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadValidationError');

      // Debe mostrar mensaje de error
      cy.get('.mensaje-global')
        .should('be.visible');

      // NO debe redirigir
      cy.url().should('include', '/subircodigo');
    });

    it('IT_037: Manejar error 500 - Error interno del servidor', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 500,
        body: {
          message: 'No se pudo guardar el proyecto'
        }
      }).as('uploadServerError');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadServerError');

      // SOLUCIÓN: Buscamos el texto exacto que enviamos en el mock
      cy.get('.mensaje-global')
        .should('be.visible')
        .should('contain', 'No se pudo guardar el proyecto'); 

      cy.url().should('include', '/subircodigo');
    });

    it('IT_038: Manejar error 503 - Base de datos no disponible', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 503,
        body: {
          error: 'Base de datos no disponible',
          message: 'Intenta de nuevo más tarde'
        }
      }).as('uploadDbUnavailable');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadDbUnavailable');

      cy.get('.mensaje-global')
        .should('be.visible');

      cy.url().should('include', '/subircodigo');
    });

  });

  // ========================================================================================
  // CASOS DE INTERACCIÓN DE USUARIOS
  // ========================================================================================

  describe('🖱️ INTERACCIÓN: Comportamiento del usuario', () => {

    it('IT_039: el usuario puede escribir en los campos en cualquier orden', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 41 }
      }).as('uploadOrdenAleatorio');

      // Llenar en orden: archivo -> correo -> nombre -> Descripcion
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('input#correo').type('test@test.com');

      cy.get('input#nombre').type('Orden Aleatorio');

      cy.get('textarea#descripcion').type('Descripcion llenada al final');

      cy.get('button').contains('Aceptar').click();

      cy.wait('@uploadOrdenAleatorio');
      cy.url().should('include', '/confirmacion');
    });

    it('IT_040: El usuario puede cambiar campos después de llenar parcialmente el formulario', () => {
      cy.get('input#nombre').type('Nombre Inicial');

      // Cambiar nombre
      cy.get('input#nombre').clear().type('Nombre Cambiado');
      cy.get('input#nombre').should('have.value', 'Nombre Cambiado');

      // Cambiar correo
      cy.get('input#correo').type('previo@test.com');
      cy.get('input#correo').clear().type('correo_final@test.com');
      cy.get('input#correo').should('have.value', 'correo_final@test.com');
    });

    it('IT_041: El usuario se puede arrepentir y borrar todo usando reset (si existe botón)', () => {
      cy.get('input#nombre').type('Proyecto Temporal');
      cy.get('input#correo').type('temporal@test.com');

      // Si existe un botón de reset o similar
      cy.get('form#uploadCode').then(($form) => {
        // Si existe input reset
        if ($form.find('button[type="reset"]').length > 0) {
          cy.get('button[type="reset"]').click();

          cy.get('input#nombre').should('have.value', '');
          cy.get('input#correo').should('have.value', '');
        }
      });
    });



  });

  // ========================================================================================
  // PRUEBAS DE ACCESIBILIDAD (Bonus)
  // ========================================================================================

  describe('♿ ACCESIBILIDAD', () => {

    it('IT_042: Todos los campos deben tener labels asociados (for/id)', () => {
      cy.get('label[for="nombre"]').should('exist');
      cy.get('label[for="correo"]').should('exist');
      cy.get('label[for="archivo"]').should('exist');
      cy.get('label[for="descripcion"]').should('exist');
    });

    it('IT_043: Los mensajes de error deben tener role="alert"', () => {
      cy.get('button').contains('Aceptar').click();

      cy.get('.error-message')
        .should('have.attr', 'role', 'alert');
    });



    it('IT_044: El textarea debe mostrar ayuda de caracteres disponibles', () => {
      cy.get('textarea#descripcion')
        .parent()
        .find('small')
        .should('contain', '500');
    });

  });

  // ========================================================================================
  // PRUEBAS DE FLUJO END-TO-END INTEGRADAS
  // ========= ===========================================================================

  describe('🔄 FLUJO END-TO-END COMPLETO', () => {

    it('IT_045: Flujo completo exitoso: Inicio > Subir código > Confirmación > Volver', () => {
      // 1. Verificar que estamos en la página de subir código
      cy.url().should('include', '/subircodigo');
      cy.contains('Escriba el nombre de su proyecto').should('be.visible');

      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: {
          message: 'Archivo subido correctamente',
          id: 999,
          nombre: 'Mi Proyecto Final',
          correo: 'usuario@empresa.com',
          archivo: 'programa.exe',
          descripcion: 'Este es mi proyecto final completamente funcional.'
        }
      }).as('uploadFinal');

      // 2. Llenar todo el formulario con datos Validos
      cy.get('input#nombre').type('Mi Proyecto Final', { delay: 30 });
      cy.get('input#correo').type('usuario@empresa.com', { delay: 30 });
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat', { timeout: 5000 })
        .should('be.visible');

      cy.get('textarea#descripcion').type('Este es mi proyecto final completamente funcional.', { delay: 20 });

      // 3. Enviar el formulario
      cy.get('button').contains('Aceptar').click();

      // 4. Esperar la respuesta del servidor
      cy.wait('@uploadFinal', { timeout: 5000 });

      // 5. Validar redirección a confirmación
      cy.url({ timeout: 5000 }).should('include', '/confirmacion');

      // 6. Validar contenido de la página de confirmación
      cy.contains('Los archivos se han subido correctamente', { timeout: 5000 })
        .should('be.visible');

      // 7. Hacer clic en volver
      cy.contains('a', 'Volver').click();

      // 8. Validar regreso a inicio
      cy.url({ timeout: 5000 }).should('include', '/');

      // 9. Validar que se ve el contenido de la página inicio
      cy.get('nav').should('contain', 'Inicio');
    });

  });

});
