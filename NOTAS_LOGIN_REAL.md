# Cambios aplicados — Login real (Elemento 1, parte de autenticación)

## Qué se agregó / modificó

**Nuevo:**
- `prisma/seed.mjs` — crea el primer usuario Administrador en la base de datos
- `src/lib/auth.ts` — helpers de sesión (JWT) y mapeo de roles
- `src/app/api/auth/login/route.ts` — valida correo/contraseña contra la BD real
- `src/app/api/auth/logout/route.ts` — cierra sesión
- `src/app/api/auth/me/route.ts` — devuelve el usuario logueado actual
- `src/app/home/layout.tsx` — bloquea /home si no hay sesión válida
- `src/app/home/red-general/layout.tsx` — bloquea /home/red-general si el rol no es ADMINISTRADOR

**Modificado:**
- `src/components/VantageLogin.tsx` — ahora llama al login real (era el único en uso, según src/app/page.tsx)
- `src/components/LoginHero.tsx` — mismo cambio, por si lo usas en el futuro
- `src/components/Dashboard.tsx` — ya no usa el selector "Probar como", ahora lee tu sesión real (nombre, rol, link de invitación) y el botón "Cerrar sesión" funciona de verdad
- `package.json` — se agregó el script `db:seed`
- `.env` — se agregó `JWT_SECRET` (ya generado y listo)

## Qué correr, en este orden

1. Reinstala dependencias (se agregó `@types/jsonwebtoken`):
   ```
   npm install
   ```

2. Crea tu primer usuario Administrador (correr una sola vez):
   ```
   npm run db:seed
   ```
   Esto imprime el correo y contraseña del Admin en la terminal — guárdalos.

3. Sube todo a GitHub:
   ```
   git add .
   git commit -m "Login real con base de datos, bcrypt y sesiones JWT"
   git push origin main
   ```

4. **CRÍTICO — antes de que funcione en producción:** ve a
   https://vercel.com/machtia-9927/machtia-4tz4/settings/environment-variables
   y agrega estas dos variables (cópialas EXACTAS de tu `.env`):
   - `DATABASE_URL`
   - `JWT_SECRET`

   Sin esto, el deploy va a fallar o el login no va a funcionar en Vercel,
   aunque sí funcione en tu máquina — Vercel no lee tu `.env` local.

5. Dale **Redeploy** al proyecto en Vercel después de agregar las variables.

## Qué probar

- Entra a la URL de producción, inicia sesión con el correo/contraseña del seed
- Deberías caer en /home viendo tu nombre real, no "Stephanie"
- El botón "Cerrar sesión" debe regresarte al login
- Si entras a /home sin sesión (por ejemplo en una ventana de incógnito), debe
  regresarte automáticamente al login
- Solo con el usuario Administrador deberías poder entrar a /home/red-general
