# Red Alterna ahora es un árbol real de 8 ramas (corrección del 18 sept 2026)

## Qué cambió

El 13 de septiembre se había confirmado que la Red Alterna seguía la
cadena real de invitación, sin límite de personas por nivel (la tabla
8→64→512→4,096→32,768 era "solo un ejemplo ilustrativo"). El 18 de
septiembre el cliente aclaró que esa confirmación fue un
malentendido: la Red Alterna **sí es un árbol real de posiciones**,
con exactamente el mismo mecanismo que la Red General / Red de
Usuarios, cambiando la constante de **2 ramas por 8 ramas** por
nivel, a 5 niveles de profundidad de comisión.

## Cómo quedó programado

- Nuevo campo en `User`: `padreAlternaId` / `hijosAlterna` /
  `posicionEnPadreAlterna` (1 a 8) — un árbol totalmente separado del
  árbol de la Red General (`padreRedId`), igual que antes.
- Al **aprobar** una solicitud (`/api/admin/aprobar`), además de
  insertarse en la Red de Usuarios, la persona se inserta por BFS
  dentro del árbol de la Red Alterna de quien la invitó
  (`insertarEnRedAlterna`), en la primera posición libre (1 a 8) —
  si las 8 ya están ocupadas, se acomoda automáticamente más abajo en
  esa misma rama.
- Las regalías (`registrarRegaliasRedAlterna`) ahora caminan hasta 5
  niveles hacia arriba por este árbol (`padreAlternaId`), NO por la
  cadena real de invitación como antes.

⚠️ **Punto que no venía explícito en lo que confirmó el cliente**: qué
pasa con el invitado número 9 en adelante de una misma persona. Se
programó que se acomode automáticamente en el primer espacio libre
más abajo de esa misma rama — el mismo comportamiento de "desborde"
que ya existe en la Red de Usuarios. Si el cliente tiene una regla
distinta en mente para este caso, avísame para ajustarlo.

## Usuarios que ya estaban aprobados antes de este cambio

Como la campaña arrancó el 16 de septiembre y ya hay gente aprobada
con la lógica vieja, se agregó `prisma/backfill-red-alterna.mjs`:

1. Toma a todos los usuarios ya **ACTIVA** que fueron invitados por
   alguien (los espacios restringidos sin invitador quedan fuera,
   igual que antes), ordenados por la fecha real en que se
   aprobaron (se reconstruye con `membresiaExpiraEn`, que siempre
   se fija a "fecha de aprobación + 365 días").
2. Borra las regalías que ya se habían generado con la lógica vieja
   (cadena de invitación).
3. Los reinserta uno por uno, en ese mismo orden, en el árbol nuevo
   de 8 ramas, y vuelve a generar sus regalías con la posición real
   que les tocó.

Esto es seguro de correr una sola vez — si se corre de nuevo no
encuentra usuarios activos "invitados sin reubicar" porque ya
quedaron todos con `padreAlternaId` asignado... aunque por seguridad,
si hace falta volver a correrlo, primero avísame para revisar que no
duplique nada.

## Qué correr, en este orden

```
npx prisma migrate deploy
npm run db:backfill-red-alterna
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Red Alterna: árbol real de 8 ramas en vez de cadena de invitación"
git push machtia main
```
