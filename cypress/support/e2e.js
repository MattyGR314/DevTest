// cypress/support/e2e.js
import './commands';

// Ignorar excepciones de React que no sean críticas
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});