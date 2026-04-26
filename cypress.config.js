const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // Configuración global
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  
  e2e: {
    // URL base de tu aplicación (ajusta el puerto si es diferente)
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    
    // Aquí especificas dónde buscar las pruebas E2E
    specPattern: 'cypress/e2e/**/*.cy.js',
    
    // Archivo de soporte (comandos personalizados)
    supportFile: 'cypress/support/e2e.js',
    
    setupNodeEvents(on, config) {
      // Aquí puedes agregar listeners de eventos
      // Por ejemplo, para tareas personalizadas
      
      // IMPORTANTE: Retornar el config modificado
      return config;
    },
  },
});
