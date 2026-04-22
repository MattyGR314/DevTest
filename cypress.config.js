const { defineConfig } = require("cypress");
// 1. Importamos la configuración interna de Webpack que usa Create React App
// Esto es vital para que las pruebas de componentes entiendan los loaders de CRA
const getWebpackConfig = require("react-scripts/config/webpack.config");

module.exports = defineConfig({
  // Configuración global de la ventana y tiempos de espera
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  
  e2e: {
    // URL base dinámica: usa variable de entorno o localhost por defecto
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    
    // Ubicación de las pruebas E2E y archivo de soporte
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',

    setupNodeEvents(on, config) {
      // Implementar listeners de eventos aquí si es necesario
      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      // 2. Inyectamos la configuración de CRA en modo desarrollo para compatibilidad total
      webpackConfig: getWebpackConfig("development"),
    },
    // Ubicación de las pruebas de componentes (normalmente junto al código fuente)
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});