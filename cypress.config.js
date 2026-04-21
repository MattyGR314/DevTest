const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  // Configuración global
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  
  e2e: {
    // URL base de tu aplicación (ajusta el puerto si es diferente)
    baseUrl: 'http://localhost:3000',
    
    // Aqui especificas donde buscar las pruebas E2E
    specPattern: 'cypress/e2e/**/*.cy.js',
    
    // Archivo de soporte (comandos personalizados)
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
            // Keep plain text when response is not JSON.
          }

          return {
            status: response.status,
            ok: response.ok,
            body: parsedBody,
          };
        },
      });
      
      // IMPORTANTE: Retornar el config modificado
      return config;
    },
  },

  component: {
    // Configuración para pruebas de componentes
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
    
    // Donde buscar las pruebas de componentes
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    
    // Archivo de soporte para componentes
    supportFile: 'cypress/support/component.js',
  },
});
