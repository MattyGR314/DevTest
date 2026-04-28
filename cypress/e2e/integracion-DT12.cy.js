/// <reference types="cypress" />

describe('DT_12 - Pruebas de integración: API Backend y Base de Datos MySQL', () => {
  // Configuración inicial. Se asume un estado preexistente (Proyecto ID: 1, dueño: 'creador@test.com').
  const projectId = 1;
  const ownerEmail = 'creador@test.com';
  const intruderEmail = 'intruso@test.com';

  it('Integración exitosa: Conexión Endpoint -> Lógica -> MySQL', () => {
    // Se prueba la conexión entre las unidades (Petición -> Servidor -> BD) [cite: 196, 202]
    cy.request({
      method: 'PUT',
      url: `/api/proyectos/${projectId}/detalles`,
      body: {
        correo: ownerEmail,
        fecha_limite: '2099-12-31',
        numero_testers: 10
      }
    }).then((response) => {
      // 1. Verificación del controlador (Express)
      expect(response.status).to.eq(200);
      expect(response.body.message).to.eq('Detalles actualizados correctamente');

      // 2. Verificación de lectura cruzada en la BD (Comprobación de persistencia real) 
      cy.request('GET', `/api/proyectos/${projectId}/detalles`).then((resGet) => {
        expect(resGet.status).to.eq(200);
        // Validar que los módulos como grupo procesaron y guardaron el dato esperado 
        expect(resGet.body.numero_testers).to.eq(10); 
      });
    });
  });

  it('Fallo de integración lógica: Middleware intercepta payload inválido', () => {
    // Comprueba que los errores surgen correctamente en la conexión entre componentes [cite: 201]
    cy.request({
      method: 'PUT',
      url: `/api/proyectos/${projectId}/detalles`,
      failOnStatusCode: false,
      body: {
        correo: ownerEmail,
        fecha_limite: '2020-01-01', // Fecha pasada (inválida)
        numero_testers: -5
      }
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.exist;
    });
  });

  it('Fallo de integración de reglas de negocio: BD rechaza usuario no propietario', () => {
    // Evalúa la consulta MySQL (SELECT correo FROM proyectos) combinada con la lógica de autorización 
    cy.request({
      method: 'PUT',
      url: `/api/proyectos/${projectId}/detalles`,
      failOnStatusCode: false,
      body: {
        correo: intruderEmail, // Usuario no dueño
        numero_testers: 5
      }
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.body.error).to.eq('Solo el dueño del proyecto puede añadir detalles');
    });
  });
});