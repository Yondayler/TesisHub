# 🚀 Guía de Despliegue en Render

Esta guía te ayudará a desplegar tu aplicación TesisHub en Render paso a paso.

## 📋 Requisitos Previos

1. ✅ Cuenta en [Render.com](https://render.com) (gratis)
2. ✅ Repositorio en GitHub (ya lo tienes)
3. ✅ Acceso a tu repositorio de GitHub

---

## 🎯 Opción 1: Despliegue Automático con render.yaml (Recomendado)

### Paso 1: Conectar Repositorio a Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub:
   - Selecciona tu cuenta de GitHub
   - Elige el repositorio `TesisHub`
   - Render detectará automáticamente el archivo `render.yaml`

### Paso 2: Render Configurará Automáticamente

Render leerá el archivo `render.yaml` y creará:
- ✅ **Backend Service** (`tesis-hub-backend`)
- ✅ **Frontend Service** (`tesis-hub-frontend`)

### Paso 3: Configurar Variables de Entorno

Render configurará automáticamente las variables de entorno del backend. **IMPORTANTE:** Necesitas configurar manualmente `VITE_API_URL` en el frontend después de que el backend esté desplegado.

**Backend (automático):**
- `NODE_ENV=production`
- `PORT=10000` (Render lo asigna automáticamente)
- `JWT_SECRET` (se genera automáticamente)
- `JWT_EXPIRES_IN=7d`
- `DB_PATH=./backend/database/database.db`
- `CORS_ORIGIN` (se configura automáticamente con la URL del frontend)

**Frontend (necesita configuración manual):**
1. Espera a que el backend se despliegue completamente
2. Copia la URL del backend (ej: `https://tesis-hub-backend.onrender.com`)
3. Ve al servicio del frontend → **"Environment"**
4. Agrega la variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://tu-backend-url.onrender.com/api`
5. Guarda y espera a que se reconstruya el frontend

### Paso 4: Esperar el Despliegue

- Render construirá ambos servicios
- El proceso puede tardar 5-10 minutos la primera vez
- Verás los logs en tiempo real

---

## 🎯 Opción 2: Despliegue Manual (Si prefieres más control)

### Paso 1: Desplegar el Backend

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura el servicio:

   **Configuración Básica:**
   - **Name:** `tesis-hub-backend`
   - **Region:** `Oregon` (o la más cercana a ti)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

   **Variables de Entorno:**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=<genera uno seguro aquí>
   JWT_EXPIRES_IN=7d
   DB_PATH=./database/database.db
   CORS_ORIGIN=<lo configurarás después con la URL del frontend>
   ```

5. Haz clic en **"Create Web Service"**
6. **Copia la URL del backend** (ej: `https://tesis-hub-backend.onrender.com`)

### Paso 2: Desplegar el Frontend

1. Haz clic en **"New +"** → **"Web Service"**
2. Conecta el mismo repositorio
3. Configura el servicio:

   **Configuración Básica:**
   - **Name:** `tesis-hub-frontend`
   - **Region:** `Oregon` (misma que el backend)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx vite preview --host 0.0.0.0 --port $PORT`

   **Variables de Entorno:**
   ```
   VITE_API_URL=<URL_DEL_BACKEND>/api
   PORT=10000
   ```

   ⚠️ **Importante:** 
   - Primero despliega el backend y copia su URL
   - Luego configura `VITE_API_URL` con la URL del backend + `/api`
   - Ejemplo: Si el backend es `https://tesis-hub-backend.onrender.com`, entonces `VITE_API_URL=https://tesis-hub-backend.onrender.com/api`
   - **Nota:** Si cambias esta variable después del despliegue, necesitarás hacer un nuevo build. Ve a "Manual Deploy" → "Clear build cache & deploy"

4. Haz clic en **"Create Web Service"**

### Paso 3: Actualizar CORS en el Backend

1. Ve al servicio del backend en Render
2. Ve a **"Environment"**
3. Actualiza `CORS_ORIGIN` con la URL del frontend:
   ```
   CORS_ORIGIN=https://tesis-hub-frontend.onrender.com
   ```
4. Guarda los cambios (esto reiniciará el servicio)

---

## 🔧 Configuración Adicional

### Generar JWT_SECRET Seguro

Si necesitas generar un JWT_SECRET seguro, puedes usar:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

O usa un generador online como: https://generate-secret.vercel.app/64

### Verificar Logs

- Ve a cada servicio en Render
- Haz clic en **"Logs"** para ver los logs en tiempo real
- Útil para debuggear problemas

### Base de Datos

⚠️ **Importante:** La base de datos SQLite se almacenará en el sistema de archivos de Render. 

**Limitaciones del plan gratuito:**
- Los datos se perderán si el servicio está inactivo por 90 días
- Para producción, considera usar PostgreSQL (Render ofrece una base de datos gratuita)

**Para usar PostgreSQL (Recomendado para producción):**

1. Ve a **"New +"** → **"PostgreSQL"**
2. Crea la base de datos
3. Obtén la conexión string
4. Actualiza el código para usar PostgreSQL en lugar de SQLite

---

## 🐛 Solución de Problemas

### Error: "Build failed"

**Causa común:** Dependencias faltantes o errores de TypeScript

**Solución:**
1. Revisa los logs del build
2. Verifica que `package.json` tenga todas las dependencias
3. Asegúrate de que el build funcione localmente primero

### Error: "Cannot find module"

**Causa común:** El código compilado no está en la ubicación correcta

**Solución:**
1. Verifica que `tsconfig.json` compile a `dist/`
2. Asegúrate de que `package.json` tenga `"main": "dist/app.js"`

### Error: CORS

**Causa común:** El frontend no puede comunicarse con el backend

**Solución:**
1. Verifica que `CORS_ORIGIN` en el backend tenga la URL correcta del frontend
2. Asegúrate de que `VITE_API_URL` en el frontend tenga la URL correcta del backend

### Error: "Database not found"

**Causa común:** El directorio `database` no existe

**Solución:**
1. Verifica que `initDatabase.ts` cree el directorio si no existe
2. Asegúrate de que `DB_PATH` apunte a la ubicación correcta

### El servicio se "duerme" después de inactividad

**Causa:** Plan gratuito de Render

**Solución:**
- La primera petición después de inactividad puede tardar ~30 segundos
- Considera usar un servicio de "ping" para mantenerlo activo
- O actualiza a un plan de pago

---

## 📝 Checklist de Despliegue

- [ ] Repositorio conectado a Render
- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado y funcionando
- [ ] Variables de entorno configuradas correctamente
- [ ] CORS configurado correctamente
- [ ] URLs copiadas y guardadas
- [ ] Probar login/registro
- [ ] Probar funcionalidades principales
- [ ] Verificar que los archivos se suban correctamente

---

## 🔗 URLs Después del Despliegue

Una vez desplegado, tendrás:

- **Backend:** `https://tesis-hub-backend.onrender.com`
- **Frontend:** `https://tesis-hub-frontend.onrender.com`

**Nota:** Las URLs pueden variar según el nombre que elijas para los servicios.

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en Render. Si tienes problemas, revisa los logs en el dashboard de Render.

**¿Necesitas ayuda?** Revisa la sección de "Solución de Problemas" arriba o los logs de Render.

