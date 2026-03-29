## DevTest

Guía paso a paso para poner en marcha la aplicación tras recibir acceso al repositorio.

### 1. Prerrequisitos
1. Tener instalado Node.js (v18 o más reciente) y npm.
2. Tener acceso a una instancia de MySQL y las credenciales necesarias.
3. Contar con el repositorio actualizado en tu máquina (clonarlo o hacer `git pull`).

### 2. Clonar y preparar el entorno
1. Si no lo hiciste aún, clona y entra al repositorio:
```bash
git clone <url-del-repositorio>
cd DevTest
```
2. Si ya lo clonaste, trae los últimos cambios:
```bash
git pull
```
3. Crea un archivo `.env` en la raíz con los valores mínimos:
```bash
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<tu-contraseña>
DB_NAME=devtest
```
4. Ajusta los valores según tu entorno (puedes cambiar `PORT` si 3000 ya está usado).

### 3. Instalar dependencias
```bash
npm install
```
Instala React, Express, MySQL y utilidades auxiliares.

### 4. Configurar la base de datos
```bash
node infra/setup_database.js
```
Este script crea la base `devtest` y la tabla `proyectos`. Si falla, asegúrate de que MySQL esté activo y que las credenciales en `.env` estén correctas.

### 5. Compilar el frontend para producción
```bash
npm run build
```
Genera la carpeta `build/`, que Express servirá como SPA.

### 6. Levantar el servidor Express
```bash
npm run dev
```
Sirve la API `/api/*` y los archivos estáticos compilados. Revisa la consola para confirmar que la conexión MySQL se inicia sin errores.

### 7. Verificaciones rápidas
1. Visita http://localhost:3000 y verifica que la interfaz cargue.
2. Comprueba la salud del backend:
```bash
curl http://localhost:3000/api/health
```
3. Usa el formulario "Subir Código" en la app para confirmar que los archivos llegan a `uploads/` y que hay registros en la tabla `proyectos`.

### 8. Flujo de desarrollo
1. Si trabajas sobre el frontend, ejecuta en paralelo:
   - `npm start` para el servidor de desarrollo de React (hot reload).
   - `npm run dev` para mantener el backend activo (usa el puerto configurado en `.env`).
2. Usa `npm run test` o `npx cypress open` solo cuando necesites validar e2e.

### 9. Notas adicionales
- El directorio `uploads/` se crea automáticamente al subir archivos.
- Mantén `.env` fuera del control de versiones; ya está ignorado por `.gitignore`.
- Si despliegas, recuerda que `build/` debe copiarse junto con `app.js` y `.env`.

- `src/` - Código fuente de React
  - `components/` - Componentes reutilizables
  - `pages/` - Páginas de la aplicación
  - `App.js` - Componente principal
- `public/` - Archivos estáticos

## Instalación para Docker

docker build -t mi-app .

docker run -p 3000:3000 --env-file .env --name my-app mi-app

