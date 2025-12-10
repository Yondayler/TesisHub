# ⚡ Inicio Rápido - Despliegue en Render

## 🚀 Pasos Rápidos (5 minutos)

### 1. Ve a Render Dashboard
👉 https://dashboard.render.com

### 2. Conecta tu Repositorio
- Haz clic en **"New +"** → **"Blueprint"**
- Conecta GitHub y selecciona `TesisHub`
- Render detectará automáticamente `render.yaml`

### 3. Espera el Despliegue del Backend
- Primera vez: 5-10 minutos
- Verás los logs en tiempo real
- **Copia la URL del backend** cuando esté listo (ej: `https://tesis-hub-backend.onrender.com`)

### 4. Configura el Frontend
⚠️ **IMPORTANTE:** Después de que el backend esté desplegado:

1. Ve al servicio del **frontend** en Render
2. Ve a **"Environment"**
3. Agrega la variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://tu-backend-url.onrender.com/api`
   - (Reemplaza `tu-backend-url` con la URL real de tu backend)
4. Guarda los cambios
5. Ve a **"Manual Deploy"** → **"Clear build cache & deploy"** para reconstruir con la nueva variable

### 5. ¡Listo!
- ✅ Backend funcionando
- ✅ Frontend conectado al backend

---

## 📝 Credenciales por Defecto

Después del despliegue, puedes iniciar sesión con:

- **Email:** `admin@tesishub.com`
- **Contraseña:** `Admin123!`

⚠️ **Importante:** Cambia estas credenciales después del primer inicio de sesión.

---

## 🔧 Si Necesitas Configuración Manual

Consulta el archivo `DEPLOY_RENDER.md` para instrucciones detalladas.

---

## ✅ Verificación Rápida

1. ✅ Backend responde en `/` → Debería mostrar JSON con `success: true`
2. ✅ Frontend carga correctamente
3. ✅ Puedes hacer login con las credenciales de admin
4. ✅ Las peticiones API funcionan

---

## 🐛 Problemas Comunes

**El servicio tarda en responder:**
- Plan gratuito se "duerme" después de inactividad
- Primera petición puede tardar ~30 segundos

**Error de CORS:**
- Verifica que `CORS_ORIGIN` en backend tenga la URL del frontend
- Render lo configura automáticamente, pero verifica en "Environment"

**Base de datos no funciona:**
- El directorio se crea automáticamente
- Si hay problemas, revisa los logs del backend

---

¡Listo para desplegar! 🎉

