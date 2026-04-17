import React from 'react';
import { mount } from 'cypress/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// IMPORTANTE: Ajusta esta ruta si tu archivo de prueba no está en la misma carpeta que el componente
import SeleccionarProyecto from './SeleccionarProyecto';

describe('Pruebas Unitarias - Componente SeleccionarProyecto', () => {
  const projectId = '123';

  // Función auxiliar para montar el componente con el contexto de React Router
  const mountComponent = () => {
    mount(
      <MemoryRouter initialEntries={[`/proyecto/${projectId}`]}>
        <Routes>
          <Route path="/proyecto/:id" element={<SeleccionarProyecto />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Interceptar la llamada inicial para obtener los datos del proyecto
    cy.intercept('GET', `/api/proyectos/${projectId}`, {
      statusCode: 200,
      body: { nombre: 'Proyecto Alpha DevTest' }
    }).as('getProyecto');
  });

  it('UT_01: Debería renderizar correctamente y mostrar el nombre del proyecto', () => {
    mountComponent();
    
    // Verifica el estado inicial de carga
    cy.contains('cargando...').should('be.visible');
    
    cy.wait('@getProyecto');
    
    // Verifica que el estado de carga desaparezca y se muestre el nombre
    cy.contains(`Inscripción a Proyecto: Proyecto Alpha DevTest`).should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Inscribirse');
  });

  it('UT_02: Debería mostrar errores de validación si los campos están vacíos', () => {
    mountComponent();
    cy.wait('@getProyecto');
    
    // Intentar enviar el formulario en blanco
    cy.get('button[type="submit"]').click();
    
    // Verificar mensajes de error
    cy.contains('El nombre es obligatorio').should('be.visible');
    cy.contains('El correo es obligatorio').should('be.visible');
    cy.get('input[name="nombre"]').should('have.class', 'error');
    cy.get('input[name="correo"]').should('have.class', 'error');
  });

  it('UT_03: Debería validar la longitud del nombre y el formato del correo', () => {
    mountComponent();
    cy.wait('@getProyecto');
    
    cy.get('input[name="nombre"]').type('A'); // Menos de 2 caracteres
    cy.get('input[name="correo"]').type('correo_sin_arroba.com'); // Formato inválido
    cy.get('button[type="submit"]').click();
    
    cy.contains('El nombre debe tener al menos 2 caracteres').should('be.visible');
    cy.contains('El correo no es válido').should('be.visible');
  });

  it('UT_04: Debería enviar el formulario exitosamente (Happy Path)', () => {
    // Interceptar el POST de inscripción con un pequeño retraso
    cy.intercept('POST', '/api/inscripciones', {
      delay: 100, // <--- AÑADE ESTA LÍNEA
      statusCode: 201,
      body: { mensaje: 'Inscripción exitosa' }
    }).as('postInscripcion');

    mountComponent();
    cy.wait('@getProyecto');
    
    // Llenar formulario correctamente
    cy.get('input[name="nombre"]').type('Desarrollador Tester');
    cy.get('input[name="correo"]').type('tester@devtest.com');
    cy.get('button[type="submit"]').click();
    
    // Verificar estado de "Guardando..."
    cy.get('button[type="submit"]').should('contain', 'Guardando...');
    cy.get('button[type="submit"]').should('be.disabled');
    
    cy.wait('@postInscripcion').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        nombre: 'Desarrollador Tester',
        correo: 'tester@devtest.com',
        id_proyectos: 123
      });
    
    // Verificar mensaje de éxito y reseteo del formulario
    cy.contains('¡Inscripción guardada exitosamente!').should('be.visible');
    cy.get('input[name="nombre"]').should('have.value', '');
  });
    
    // Verificar mensaje de éxito y reseteo del formulario
    cy.contains('¡Inscripción guardada exitosamente!').should('be.visible');
    cy.get('input[name="nombre"]').should('have.value', '');
  });

  it('UT_05: Debería manejar errores del servidor al intentar inscribirse', () => {
    cy.intercept('POST', '/api/inscripciones', {
      statusCode: 500,
      body: { error: 'Error interno de la base de datos' }
    }).as('postInscripcionError');

    mountComponent();
    cy.wait('@getProyecto');
    
    cy.get('input[name="nombre"]').type('Desarrollador Tester');
    cy.get('input[name="correo"]').type('tester@devtest.com');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@postInscripcionError');
    
    // Verificar que se muestre el error general provisto por el backend
    cy.contains('Error interno de la base de datos').should('be.visible');
  });

  it('UT_06: Debería limpiar el mensaje de error al comenzar a escribir', () => {
    mountComponent();
    cy.wait('@getProyecto');
    
    // 1. Provocar los errores
    cy.get('button[type="submit"]').click();
    cy.contains('El nombre es obligatorio').should('be.visible');
    cy.get('input[name="nombre"]').should('have.class', 'error');

    // 2. Escribir en el campo y verificar que el error desaparece
    cy.get('input[name="nombre"]').type('A');
    cy.get('input[name="nombre"]').should('not.have.class', 'error');
    cy.contains('El nombre es obligatorio').should('not.exist');
  });

  it('UT_07: Debería deshabilitar los inputs mientras la petición está en curso', () => {
    cy.intercept('POST', '/api/inscripciones', (req) => {
      req.reply((res) => {
        res.setDelay(1000); // 1 segundo de latencia
        res.send({ statusCode: 201, body: {} });
      });
    }).as('postInscripcionLatencia');

    mountComponent();
    cy.wait('@getProyecto');
    
    cy.get('input[name="nombre"]').type('Desarrollador Tester');
    cy.get('input[name="correo"]').type('tester@devtest.com');
    cy.get('button[type="submit"]').click();
    
    // Verificar estado disabled INMEDIATAMENTE tras el clic
    cy.get('input[name="nombre"]').should('be.disabled');
    cy.get('input[name="correo"]').should('be.disabled');
    cy.get('button[type="submit"]').should('be.disabled');
    
    cy.wait('@postInscripcionLatencia');
  });

  it('UT_08: Debería ocultar el mensaje de éxito exactamente a los 5 segundos', () => {
    cy.clock(); 
    
    cy.intercept('POST', '/api/inscripciones', {
      statusCode: 201,
      body: {}
    }).as('postInscripcion');

    mountComponent();
    cy.wait('@getProyecto');
    
    cy.get('input[name="nombre"]').type('Usuario Reloj');
    cy.get('input[name="correo"]').type('reloj@devtest.com');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@postInscripcion');
    
    cy.contains('¡Inscripción guardada exitosamente!').should('be.visible');
    
    cy.tick(4999);
    cy.contains('¡Inscripción guardada exitosamente!').should('be.visible');

    cy.tick(1); // Completamos los 5000ms
    cy.contains('¡Inscripción guardada exitosamente!').should('not.exist');
  });

  it('UT_09: Debería mostrar un error si el servidor falla al cargar datos iniciales', () => {
    cy.intercept('GET', `/api/proyectos/${projectId}`, {
      statusCode: 404,
      body: { error: 'Not Found' }
    }).as('getProyectoFallo');

    mountComponent();
    cy.wait('@getProyectoFallo');
    
    cy.contains('Error: No se pudo obtener el proyecto').should('be.visible');
    cy.get('input[name="nombre"]').should('be.disabled');
  });
});