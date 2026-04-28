const { defineConfig } = require("cypress");
// Asegura NODE_ENV para que react-scripts no falle al cargar webpack.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
// 1. Importamos la configuración interna de Webpack que usa Create React App
// Esto es vital para que las pruebas de componentes entiendan los loaders de CRA
const getWebpackConfig = require("react-scripts/config/webpack.config");
const fs = require('fs');
const path = require('path');

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
      on('task', {
        async multipartRequest({ url, method = 'POST', fields = {}, filePath, fileField = 'archivo', fileName }) {
          if (!url) {
            throw new Error('multipartRequest requiere la propiedad "url"');
          }

          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, String(value));
          });

          if (filePath) {
            const absoluteFilePath = path.isAbsolute(filePath)
              ? filePath
              : path.resolve(config.projectRoot, filePath);

            if (!fs.existsSync(absoluteFilePath)) {
              throw new Error(`Archivo no encontrado para multipartRequest: ${absoluteFilePath}`);
            }

            const buffer = fs.readFileSync(absoluteFilePath);
            const blob = new Blob([buffer]);
            formData.append(fileField, blob, fileName || path.basename(absoluteFilePath));
          }

          const response = await fetch(url, {
            method,
            body: formData,
          });

          const responseText = await response.text();
          let parsedBody = responseText;

          try {
            parsedBody = responseText ? JSON.parse(responseText) : null;
          } catch (error) {
            // Conservar texto plano cuando la respuesta no es JSON
          }

          return {
            status: response.status,
            ok: response.ok,
            body: parsedBody,
          };
        },
      });
      
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
    // Ubicación de las pruebas de componentes
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});