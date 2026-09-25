# Análisis de Avances 2/3 — lo que quedó 100% claro (25 sept 2026)

El cliente mandó una lista de 10 puntos. De esos, estos 4 quedaron
completamente entendidos y ya se implementaron, probados y listos
para producción. Los otros 6 (rediseño del registro, árbol gráfico de
Campaña de Lanzamiento, sección "Publicidad", y 3 reportes de bug que
necesitan un detalle puntual del cliente para no arreglar a ciegas)
quedan para la siguiente ronda.

## 1. Países nuevos

Se agregaron Brasil, Portugal y Francia a la lista de países del
registro (España ya estaba). Un solo lugar (`src/lib/ubicaciones.ts`),
usado tanto en el registro normal como en el restringido.

## 2. Apellidos duplicados — causa encontrada y corregida

El formulario de preregistro (paso 1, cuando alguien entra por un
link de invitación) pedía "Nombre y Apellido" completo (ej. "María
López"). Pero el paso 2 del registro vuelve a pedir el apellido por
separado, y el sistema termina guardando `nombre="María López"` +
`apellido="López"` → se mostraba en todos lados como
"María López López".

**Corrección para registros nuevos:** el paso 1 ahora pide solo el
nombre (`src/components/InvitacionLanding.tsx`), ya que el apellido
se captura correctamente en el paso 2. Esto aplica tanto al registro
normal como al de espacios restringidos (Red General), porque
comparten el mismo formulario.

**Corrección para quienes YA quedaron mal guardados:** se agregó el
script `prisma/corregir-apellidos-duplicados.mjs`
(`npm run db:corregir-apellidos-duplicados`). Revisa a cada usuario y,
SOLO cuando el nombre termina exactamente con el apellido (sin
ambigüedad), le quita esa parte repetida del nombre — ej. "María
López" + apellido "López" → nombre queda "María". Cualquier caso que
no calce exacto se reporta en la consola para revisar a mano, en vez
de recortar mal el nombre de alguien.

## 3. Borrar notificaciones ya vistas

Ahora cada notificación de la campanita tiene una "×" para borrarla.

- Las notificaciones **personales** (invitado directo nuevo, alguien
  se unió a tu Red 2x15) se borran de verdad — son solo tuyas.
- Los avisos **generales** del Administrador (compartidos por todos)
  no se pueden borrar de raíz sin afectarle a los demás — en vez de
  eso, se guarda que TÚ ya lo ocultaste, y a partir de ahí deja de
  aparecerte a ti (a los demás usuarios les sigue apareciendo
  normal). Se agregó una tabla nueva para esto (`NotificacionOculta`).

## 4. Foto de perfil en miniatura

El círculo de arriba a la derecha del Dashboard siempre mostraba la
inicial del nombre, nunca la foto real aunque ya la hubieran subido.
Ahora, si el usuario tiene foto de perfil, se muestra esa foto en
miniatura ahí; si no, siguen apareciendo las iniciales como antes.

## Base de datos

Esta ronda SÍ trae un cambio de esquema (tabla nueva
`NotificacionOculta`) — hay que correr `npx prisma migrate deploy`.

## Qué correr, en este orden

```
npm install
npx prisma migrate deploy
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Paises nuevos, correccion de apellidos duplicados, borrar notificaciones y foto de perfil en miniatura"
git push machtia main
npm run db:corregir-apellidos-duplicados
```

(El script de corregir apellidos va al final, después de subir el
código, como siempre — así si algo falla en la migración/tsc se
detecta antes de tocar nombres reales.)
