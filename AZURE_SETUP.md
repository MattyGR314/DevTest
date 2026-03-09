# Guía: Conectar DevTest App a MySQL en Azure

## ✓ Cambios Realizados Localmente

Tu aplicación ahora está configurada para conectarse a MySQL en Azure. Se agregaron:

- ✓ **Dependencias**: `mysql2` y `dotenv`
- ✓ **Pool de Conexiones**: Gestión automática de conexiones a BD
- ✓ **Rutas API**:
  - `GET /api/health` — Verifica la conexión a la BD
  - `GET /api/test` — Prueba query a la BD
- ✓ **Variables de Entorno**: Configuradas en `.env`

## 📝 Variables de Entorno

Tu app usa estas variables:
```
DB_HOST=devttest-db.mysql.database.azure.com
DB_USER=devttestadmin
DB_PASSWORD=TurrasPaga100$
DB_NAME=devttest-db
PORT=3000
```

## 🧪 Prueba Local

Para probar localmente:

```bash
npm run dev
```

Luego abre:
- App: http://localhost:3000
- Health Check: http://localhost:3000/api/health
- Test BD: http://localhost:3000/api/test

## ☁️ Configuración en Azure App Service

Para conectar tu app desplegada en Azure:

### 1. Ir a App Service

1. Abre el [Portal de Azure](https://portal.azure.com)
2. Navega a tu **App Service** (`DevTest`)
3. En el panel izquierdo, busca **Configuración** → **Variables de entorno**

### 2. Agregar Variables de Entorno

Haz clic en **+ Agregar variable** y crea estas 4 variables:

| Variable | Valor |
|----------|-------|
| `DB_HOST` | `devttest-db.mysql.database.azure.com` |
| `DB_USER` | `devttestadmin` |
| `DB_PASSWORD` | `TurrasPaga100$` |
| `DB_NAME` | `devttest-db` |

### 3. Guardar Cambios

- Haz clic en **Guardar**
- El App Service se reiniciará automáticamente

### 4. Verificar Conexión

Una vez que reinicie (1-2 minutos):

```
https://[tu-app-service].azurewebsites.net/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Aplicación y BD conectadas correctamente"
}
```

## 🔒 Seguridad (Recomendaciones Futuras)

Para mayor seguridad, considera usar:
- **Azure Key Vault** para almacenar credenciales
- **Managed Identity** en lugar de usuario/contraseña
- **SSL/TLS** para conexión a BD

## 🚀 Deploy a Azure

Si aún no has desplegado, usa Azure Developer CLI:

```bash
azd up
```

O redeploy si ya existe:

```bash
azd deploy
```

## 📝 Próximos Pasos

1. Configura las variables en App Service
2. Prueba `/api/health` desde la URL de tu app
3. Crea rutas API personalizadas según tus necesidades
4. Considera implementar Middleware de autenticación

---

**¿Preguntas?** Revisa los logs de App Service si hay errores de conexión.
