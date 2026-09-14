# Cambios aplicados — Recuperar / crear contraseña

## Qué se agregó

**Nuevo:**
- `src/app/api/auth/solicitar-reset/route.ts` — genera el link y
  manda el correo (o lo muestra en modo desarrollo si Brevo no está
  conectado todavía)
- `src/app/api/auth/restablecer/[token]/route.ts` — valida el link
  y guarda la nueva contraseña
- `src/app/recuperar/page.tsx` — pantalla para pedir el link
- `src/app/restablecer/[token]/page.tsx` + `RestablecerPassword.tsx`
  — pantalla para escribir la nueva contraseña

**Modificado:**
- `VantageLogin.tsx` y `LoginHero.tsx` — el link "¿Olvidaste tu
  contraseña?" ya funciona de verdad (antes iba a ningún lado)
- `.gitignore` — se agregó `tsconfig.tsbuildinfo` (era un archivo de
  caché que se estaba subiendo a git sin necesidad en cada commit)

No hubo cambios al schema — se reutilizó el campo `tokenConfirmacion`
que ya existía en `User` sin usarse.

## Por qué importa esto

Con este mismo flujo se resuelven DOS pendientes a la vez:
1. El link de "olvidé mi contraseña" ya funciona
2. Las cuentas que el Administrador registra manualmente en la Red
   General (espacios restringidos) ya tienen una forma de obtener su
   contraseña por primera vez — mándales el link de "/recuperar" con
   su correo y van a poder crear su acceso

## Qué correr

Sin cambios al schema, no hace falta migración:

```
npm install
npx tsc --noEmit
git add .
git commit -m "Flujo real de recuperar/crear contraseña"
git push machtia main
```

## Cómo probar

1. En el login, dale clic a "¿Olvidaste tu contraseña?"
2. Escribe el correo del Admin (admin@machtiaeducacion.com)
3. Como Brevo no está conectado todavía, va a aparecer el link
   directo en pantalla (modo desarrollo) — dale clic
4. Escribe una contraseña nueva dos veces
5. Debería confirmar el cambio y mandarte de vuelta al login
6. Prueba iniciar sesión con la contraseña nueva
