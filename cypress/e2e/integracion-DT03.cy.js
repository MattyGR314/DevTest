/// <reference types="cypress" />
// test de pipeline
describe('INTEGRACIÓN: Módulo Subir Código - Flujo Completo', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    cy.visit('http://localhost:3000/subircodigo', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        cy.stub(win, 'alert').as('alert');
      }
    });

    cy.get('form#uploadCode', { timeout: 2000 }).should('be.visible');
  });

  afterEach(() => {
    cy.window().then((win) => {
      const consoleErrors = [];
      const originalError = win.console.error;
      
      win.console.error = function(...args) {
        const errorMsg = args[0]?.toString() || '';
        if (!errorMsg.includes('Network error') && !errorMsg.includes('404')) {
          consoleErrors.push(errorMsg);
        }
        originalError.apply(win.console, args);
      };
    });
  });

  describe('HAPPY PATH - Flujo exitoso', () => {

    it('IT_SC_001: Subir proyecto con todos los campos válidos (SIN descripción)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: {
          message: 'Archivo subido correctamente',
          id: 1,
          nombre: 'Mi Primer Proyecto',
          correo: 'usuario@test.com',
          archivo: 'programa.exe'
        }
      }).as('uploadSuccess');

      cy.get('input#nombre', { timeout: 2000 })
        .should('be.visible')
        .type('Mi Primer Proyecto', { delay: 50 });

      cy.get('input#correo', { timeout: 2000 })
        .should('be.visible')
        .type('usuario@test.com', { delay: 50 });

      cy.get('input#archivo')
        .selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 })
        .should('be.visible');

      cy.get('textarea#descripcion', { timeout: 2000 })
        .should('have.value', '');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadSuccess', { timeout: 2000 });
      cy.url({ timeout: 2000 }).should('include', '/confirmacion');
      cy.contains('Los archivos se han subido correctamente', { timeout: 2000 })
        .should('be.visible');
    });

    it('IT_SC_002: Subir proyecto CON descripción válida (100 caracteres)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: {
          message: 'Archivo subido correctamente',
          id: 2,
          nombre: 'Juego Educativo',
          correo: 'desarrollador@test.com',
          descripcion: 'Un juego educativo interactivo para aprender programación'
        }
      }).as('uploadWithDesc');

      cy.get('input#nombre', { timeout: 2000 }).type('Juego Educativo');
      cy.get('input#correo', { timeout: 2000 }).type('desarrollador@test.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      const descripcion = 'Un juego educativo interactivo para aprender programación';
      cy.get('textarea#descripcion', { timeout: 2000 }).type(descripcion, { delay: 30 });

      cy.get('textarea#descripcion', { timeout: 2000 }).should('have.value', descripcion);

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadWithDesc');

      cy.url({ timeout: 2000 }).should('include', '/confirmacion');
      cy.contains('Los archivos se han subido correctamente', { timeout: 2000 }).should('be.visible');
    });

    it('IT_SC_003: Subir proyecto con descripción máxima (500 caracteres)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 3 }
      }).as('uploadMaxDesc');

      cy.get('input#nombre', { timeout: 2000 }).type('Proyecto Con Descripcion Larga');
      cy.get('input#correo', { timeout: 2000 }).type('dev@test.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      const descripcion500 = 'A'.repeat(500);
      cy.get('textarea#descripcion', { timeout: 2000 })
        .type(descripcion500, { delay: 0 });

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadMaxDesc');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_004: El botón Volver desde confirmación regresa a Inicio', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 4 }
      }).as('upload');

      cy.get('input#nombre', { timeout: 2000 }).type('Test Navegacion');
      cy.get('input#correo', { timeout: 2000 }).type('nav@test.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@upload');

      cy.url({ timeout: 2000 }).should('include', '/confirmacion');
      cy.contains('Los archivos se han subido correctamente', { timeout: 2000 }).should('be.visible');

      cy.contains('a', 'Volver').click();
      cy.url({ timeout: 2000 }).should('include', '/');
    });

  });

  describe('VALIDACIÓN: Campos obligatorios', () => {

    it('IT_SC_005: Rechazar formulario completamente vacío', () => {
      cy.contains('button', 'Aceptar').click();

      cy.get('input#nombre', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'El nombre del proyecto es obligatorio');

      cy.get('input#correo', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'El correo electrónico es obligatorio');

      cy.get('input#archivo', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'Debes seleccionar un archivo');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_006: Campo NOMBRE obligatorio - Error específico', () => {
      cy.get('input#correo', { timeout: 2000 }).type('test@test.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#nombre', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'El nombre del proyecto es obligatorio');

      cy.url({ timeout: 2000 }).should('include', '/subircodigo');
    });

    it('IT_SC_007: Campo CORREO obligatorio - Error específico', () => {
      cy.get('input#nombre', { timeout: 2000 }).type('Nombre Valido');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#correo', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'El correo electrónico es obligatorio');

      cy.url({ timeout: 2000 }).should('include', '/subircodigo');
    });

    it('IT_SC_008: Campo ARCHIVO obligatorio - Error cuando no se selecciona', () => {
      cy.get('input#nombre', { timeout: 2000 }).type('Nombre Valido');
      cy.get('input#correo', { timeout: 2000 }).type('test@test.com');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#archivo', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'Debes seleccionar un archivo');

      cy.url({ timeout: 2000 }).should('include', '/subircodigo');
    });

    it('IT_SC_009: Los errores se limpian cuando el usuario empieza a escribir', () => {
      cy.contains('button', 'Aceptar').click();
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('be.visible');
      cy.get('input#nombre').type('Nuevo Nombre');
      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('not.exist');
    });

  });

  describe('VALIDACIÓN: Campo NOMBRE', () => {

    it('IT_SC_010: Rechazar nombre con caracteres especiales (@, !, #, etc.)', () => {
      cy.get('input#nombre', { timeout: 2000 }).type('Proyecto@!#Invalid');
      cy.get('input#correo', { timeout: 2000 }).type('test@test.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#nombre', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('contain', 'El nombre no puede contener caracteres especiales');

      cy.url({ timeout: 2000 }).should('include', '/subircodigo');
    });

    it('IT_SC_011: Aceptar nombre con espacios y números (válido)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 11 }
      }).as('uploadValid');

      cy.get('input#nombre').type('Proyecto 2024 Version 3');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadValid');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_012: Aceptar nombre con puntos (ejemplo: Proyecto.v1)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 12 }
      }).as('uploadPoint');

      cy.get('input#nombre').type('Mi.Proyecto.v1');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadPoint');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_013: Rechazar nombre con caracteres especiales (-, _, ~, etc.)', () => {
      cy.get('input#nombre').type('Proyecto-Inválido_Test~Name');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('contain', 'El nombre no puede contener caracteres especiales');
    });

  });

  describe('VALIDACIÓN: Campo CORREO', () => {

    it('IT_SC_014: Rechazar correo sin @', () => {
      cy.get('input#nombre', { timeout: 2000 }).type('Nombre Valido');
      cy.get('input#correo', { timeout: 2000 }).type('usuarioinvalido.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.get('button[type="submit"]').contains('Aceptar').click();

      cy.get('input#correo', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('contain', 'El correo no sigue los estándares establecidos');

      cy.url({ timeout: 2000 }).should('include', '/subircodigo');
    });

    it('IT_SC_015: Rechazar correo sin punto en dominio', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('usuario@dominiosinpunto');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#correo', { timeout: 2000 })
        .parent()
        .find('.error-message')
        .should('contain', 'El correo no sigue los estándares establecidos');
    });

    it('IT_SC_016: Aceptar correo válido con dominio estándar', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 16 }
      }).as('uploadValidEmail');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('usuario.valido@dominio.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadValidEmail');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_017: Aceptar correo con subdominios', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 17 }
      }).as('uploadSubdomain');

      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('usuario@mail.empresa.co');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadSubdomain');

      cy.url().should('include', '/confirmacion');
    });

  });

  describe('VALIDACIÓN: Campo ARCHIVO', () => {

    it('IT_SC_018: Rechazar archivo que no es ejecutable', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');

      cy.get('input#archivo')
        .selectFile('cypress/fixtures/documento.txt', { force: true });

      cy.contains('button', 'Aceptar').click();

      cy.get('input#archivo')
        .parent()
        .find('.error-message')
        .should('contain', 'El archivo debe ser ejecutable (.exe o .bat)');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_019: Aceptar archivo .exe ejecutable', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 19 }
      }).as('uploadExe');

      cy.get('input#nombre').type('Proyecto Exe');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo')
        .selectFile('cypress/fixtures/programa.exe', { force: true });

      cy.contains('Archivo seleccionado: programa.exe', { timeout: 2000 })
        .should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadExe');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_020: Aceptar archivo .bat ejecutable', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 20 }
      }).as('uploadBat');

      cy.get('input#nombre').type('Proyecto Batch');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo')
        .selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 })
        .should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadBat');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_021: Mostrar nombre del archivo seleccionado en mensaje de confirmación', () => {
      cy.get('input#nombre').type('Nombre Valido');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo')
        .selectFile('cypress/fixtures/test-script.bat', { force: true });
      cy.contains('Archivo seleccionado: test-script.bat', { timeout: 2000 })
        .should('be.visible');
    });

  });

  describe('VALIDACIÓN: Campo DESCRIPCIÓN', () => {

    it('IT_SC_022: Campo descripción es opcional', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 22 }
      }).as('uploadNoDesc');

      cy.get('input#nombre').type('Proyecto Sin Descripcion');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('textarea#descripcion').should('have.value', '');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadNoDesc');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_023: Aceptar descripción válida de 250 caracteres', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 23 }
      }).as('uploadDesc250');

      const desc = 'A'.repeat(250);

      cy.get('input#nombre').type('Proyecto Con Descripcion');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('textarea#descripcion').type(desc);
      cy.get('textarea#descripcion').should('have.value', desc);

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadDesc250');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_024: Rechazar descripción con más de 500 caracteres', () => {
      cy.get('input#nombre').type('Proyecto Descripcion Larga');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      // Forzar 501 caracteres en un textarea controlado por React.
      const desc501 = 'A'.repeat(501);
      cy.window().then((win) => {
        cy.get('textarea#descripcion').then(($textarea) => {
          const textarea = $textarea[0];
          const nativeSetter = Object.getOwnPropertyDescriptor(
            win.HTMLTextAreaElement.prototype,
            'value'
          ).set;

          nativeSetter.call(textarea, desc501);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });

      cy.contains('button', 'Aceptar').click();

      cy.get('textarea#descripcion')
        .parent()
        .find('.error-message')
        .should('contain', 'La descripción no puede exceder 500 caracteres');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_025: El textarea se expande automáticamente al escribir', () => {
      cy.get('textarea#descripcion')
        .invoke('height')
        .then((initialHeight) => {
          const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
          cy.get('textarea#descripcion').type(longText);
          cy.get('textarea#descripcion')
            .invoke('height')
            .should('be.greaterThan', initialHeight);
        });
    });

  });

  describe('VALIDACIÓN: Errores del servidor', () => {

    it('IT_SC_026: Manejar error 409 - Proyecto duplicado', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 409,
        body: { 
          error: 'Ya existe un proyecto con este nombre',
          message: 'Ya existe un proyecto con este nombre'
        }
      }).as('uploadConflict');

      cy.get('input#nombre').type('Proyecto Duplicado');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadConflict');

      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('be.visible')
        .should('contain', 'Ya existe un proyecto con este nombre');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_027: Manejar error 400 - Validación del servidor', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 400,
        body: { 
          message: 'El archivo excede el tamaño máximo permitido'
        }
      }).as('uploadBadRequest');

      cy.get('input#nombre').type('Archivo Grande');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadBadRequest');

      cy.get('.mensaje-global')
        .should('be.visible')
        .should('contain', 'El archivo excede el tamaño máximo permitido');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_028: Manejar error 500 - Error interno del servidor', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 500,
        body: { 
          message: 'Error interno del servidor'
        }
      }).as('uploadServerError');

      cy.get('input#nombre').type('Test Server Error');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadServerError');

      cy.get('.mensaje-global')
        .should('be.visible')
        .should('contain', 'Error interno del servidor');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_029: Manejar error 503 - Servicio no disponible', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 503,
        body: { 
          message: 'La base de datos no está disponible'
        }
      }).as('uploadServiceUnavailable');

      cy.get('input#nombre').type('Test BD Unavailable');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadServiceUnavailable');

      cy.get('.mensaje-global')
        .should('be.visible')
        .should('contain', 'La base de datos no está disponible');

      cy.url().should('include', '/subircodigo');
    });

    it('IT_SC_030: Manejar error de conexión (timeout)', () => {
      cy.intercept('POST', '/subircodigo', (req) => {
        req.destroy();
      }).as('uploadNetworkError');

      cy.get('input#nombre').type('Test Network Error');
      cy.get('input#correo', { timeout: 2000 }).type('test@test.com');
      cy.get('input#archivo', { timeout: 2000 }).selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat', { timeout: 2000 }).should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('.mensaje-global', { timeout: 2000 })
        .should('be.visible')
        .should('contain', 'Error de conexión');

      cy.url().should('include', '/subircodigo');
    });

  });

  describe('INTERACCIÓN: Comportamiento de la interfaz', () => {

    it('IT_SC_031: Los campos mantienen el foco visual cuando tienen error', () => {
      cy.contains('button', 'Aceptar').click();

      cy.get('input#nombre')
        .should('have.class', 'error');

      cy.get('input#correo')
        .should('have.class', 'error');

      cy.get('input#archivo')
        .should('have.class', 'error');
    });

    it('IT_SC_032: El botón Aceptar se deshabilita mientras se procesa (enviando)', () => {
      cy.intercept('POST', '/subircodigo', (req) => {
        req.reply({
          delay: 800,
          statusCode: 200,
          body: { message: 'Archivo subido correctamente' }
        });
      }).as('uploadWithDelay');

      cy.get('input#nombre').type('Test Button State');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('button[type="submit"]').as('submitButton').click();
      cy.get('@submitButton').should('be.disabled').and('contain', 'Enviando');
      cy.wait('@uploadWithDelay');
    });

    it('IT_SC_033: Se puede limpiar el formulario manualmente', () => {
      cy.get('input#nombre').type('Proyecto Test');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.get('textarea#descripcion').type('Descripción');
      cy.get('input#nombre').should('have.value', 'Proyecto Test');
      cy.get('input#correo').should('have.value', 'test@test.com');
      cy.get('textarea#descripcion').should('have.value', 'Descripción');
      cy.get('input#nombre').clear();
      cy.get('input#correo').clear();
      cy.get('textarea#descripcion').clear();

      cy.get('input#nombre').should('have.value', '');
      cy.get('input#correo').should('have.value', '');
      cy.get('textarea#descripcion').should('have.value', '');
    });

  });

  describe('EDGE CASES: Límites y bordes', () => {

    it('IT_SC_034: Nombre con solo espacios es rechazado', () => {
      cy.get('input#nombre').type('     ');
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#nombre')
        .parent()
        .find('.error-message')
        .should('contain', 'El nombre del proyecto es obligatorio');
    });

    it('IT_SC_035: Correo con solo espacios es rechazado', () => {
      cy.get('input#nombre').type('Nombre Válido');
      cy.get('input#correo').type('     ');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.contains('button', 'Aceptar').click();

      cy.get('input#correo')
        .parent()
        .find('.error-message')
        .should('contain', 'El correo electrónico es obligatorio');
    });

    it('IT_SC_036: Nombre muy largo (máximo 100 caracteres)', () => {
      cy.intercept('POST', '/subircodigo', {
        statusCode: 200,
        body: { message: 'Archivo subido correctamente', id: 36 }
      }).as('uploadLongName');

      const longName = 'A'.repeat(100);
      cy.get('input#nombre').type(longName);
      cy.get('input#correo').type('test@test.com');
      cy.get('input#archivo').selectFile('cypress/fixtures/script.bat', { force: true });
      cy.contains('Archivo seleccionado: script.bat').should('be.visible');

      cy.get('input#nombre').should('have.value', longName);

      cy.contains('button', 'Aceptar').click();
      cy.wait('@uploadLongName');

      cy.url().should('include', '/confirmacion');
    });

    it('IT_SC_037: Cambiar de archivo después de seleccionar uno', () => {
      cy.get('input#nombre').type('Test Cambio Archivo');
      cy.get('input#correo').type('test@test.com');

      cy.get('input#archivo')
        .selectFile('cypress/fixtures/script.bat', { force: true });

      cy.contains('Archivo seleccionado: script.bat')
        .should('be.visible');

      cy.get('input#archivo')
        .selectFile('cypress/fixtures/test-script.bat', { force: true });

      cy.contains('Archivo seleccionado: test-script.bat')
        .should('be.visible');
    });

  });

});
