# Cómo obtener tu API Key GRATUITA de Football-Data.org

## Paso 1: Registrarte
1. Ve a: https://www.football-data.org/client/register
2. Rellena el formulario:
   - Email
   - Nombre
   - Confirmar que es para uso personal/educativo
3. Haz clic en "Register"

## Paso 2: Verificar tu email
1. Revisa tu correo electrónico
2. Haz clic en el enlace de verificación

## Paso 3: Obtener tu API Key
1. Inicia sesión en: https://www.football-data.org/client/login
2. Ve a tu dashboard
3. Copia tu API Key (algo como: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6)

## Paso 4: Configurar en tu proyecto

### Opción A: Agregar al archivo .env.local
Crea o edita el archivo `.env.local` en la raíz del proyecto:

```
FOOTBALL_DATA_KEY=tu_api_key_aqui
```

### Opción B: Probar con el script de prueba
Edita el archivo `test-football-data.js`:
```javascript
const API_KEY = 'tu_api_key_aqui'; // <-- Pegar aquí
```

Luego ejecuta:
```bash
node test-football-data.js
```

## ✅ Listo!

Ahora tienes acceso a:
- ✅ Temporada actual 2024-2025
- ✅ Todas las ligas principales
- ✅ 10 peticiones por minuto
- ✅ Estadísticas de equipos y partidos
- ✅ 100% GRATIS

## Límites del plan gratuito:
- 10 peticiones por minuto
- Datos actualizados diariamente
- Sin tarjeta de crédito requerida
