const { defineConfig } = require("cypress");
// 1. Importamos la configuración interna de Webpack que usa Create React App
const getWebpackConfig = require("react-scripts/config/webpack.config");

module.exports = defineConfig({
  // Configuración global
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      // 2. Le inyectamos la configuración de CRA en modo desarrollo
      webpackConfig: getWebpackConfig("development"),
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});