# DevTest

Aplicación React para gestión de proyectos.

## Instalación

```bash
npm install
```

## Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm start
```

La aplicación se abrirá en [http://localhost:3000](http://localhost:3000).

## Build

Para construir la aplicación para producción:

```bash
npm run build
```

## Estructura

- `src/` - Código fuente de React
  - `components/` - Componentes reutilizables
  - `pages/` - Páginas de la aplicación
  - `App.js` - Componente principal
- `public/` - Archivos estáticos

## Instalación para Docker

docker build -t mi-app .

docker run -p 3000:3000 --env-file .env --name my-app mi-app