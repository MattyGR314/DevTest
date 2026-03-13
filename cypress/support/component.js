// cypress/support/component.js

// Importar comandos personalizados
import './commands';

// Importar estilos globales si los necesitas
// import '../../src/index.css';

// Montar componentes con React
import { mount } from 'cypress/react';

// Hacer mount disponible globalmente
Cypress.Commands.add('mount', mount);