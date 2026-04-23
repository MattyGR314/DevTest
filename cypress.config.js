const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
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
      framework: "create-react-app",
      bundler: "webpack",
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});