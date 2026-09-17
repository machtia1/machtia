# Anuncios y avisos — ahora editables desde el Panel de Administrador

(17 sept 2026 — pendiente confirmado por Daniel por WhatsApp)

## Qué había antes

La sección "Anuncios y avisos" del Dashboard mostraba 3 textos fijos,
escritos directamente en el código — nadie los podía cambiar sin que
yo tocara y volviera a desplegar el proyecto.

## Qué cambió

- **Tabla nueva:** `Anuncio` (etiqueta, texto, activo, fecha).
- **Nueva sección en el Panel de Administrador:** "Anuncios", junto a
  "Red General" y "Usuarios" — exclusiva de Administrador. Ahí puedes:
  - Publicar un anuncio nuevo (etiqueta + texto).
  - Editar la etiqueta o el texto de uno existente.
  - Desactivarlo (deja de verse en el Dashboard, pero no se borra —
    se puede reactivar después) o eliminarlo definitivamente.
- El Dashboard de **todos** los usuarios ahora jala los anuncios
  activos directamente de la base de datos, ordenados del más
  reciente al más viejo, con su fecha relativa ("Hoy", "Ayer", "Hace
  N días") calculada automáticamente.
- Se sembraron los 3 anuncios que ya existían fijos en el código
  (`prisma/seed-anuncios.mjs`), para que el Dashboard no se vea vacío
  justo después de este cambio — se pueden editar o borrar como
  cualquier otro desde el Panel de Administrador.

## Qué correr, en este orden

1. Aplica la migración (crea la tabla `Anuncio`):
   ```
   npx prisma migrate deploy
   ```
2. Siembra los 3 anuncios iniciales — UNA SOLA VEZ:
   ```
   npm run db:seed-anuncios
   ```
   Es seguro correrlo más de una vez por error: si ya hay anuncios en
   la base, no crea nada nuevo.
3. Verifica que compile limpio:
   ```
   npx tsc --noEmit --skipLibCheck
   ```
4. Sube el código de siempre (`git add .` → `git commit` →
   `git push machtia main`).

## Verificación recomendada

Entra como Administrador → Panel de Administrador → Anuncios. Deberías
ver los 3 anuncios existentes, poder editar uno, desactivarlo y verlo
desaparecer del Dashboard normal, y publicar uno nuevo y verlo
aparecer ahí mismo.
