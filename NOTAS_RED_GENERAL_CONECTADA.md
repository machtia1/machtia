# Cambios aplicados — Red General conectada como un solo árbol real

(17 sept 2026 — idea propuesta por el cliente por WhatsApp, mismo día)

## El problema que resolvía esto

Hasta antes de este cambio, las personas de los 8 niveles restringidos
de la Red General (`SlotRestringido`) existían en la base de datos
**desconectadas** del árbol binario real (`padreRedId`/`ladoEnPadre`):
cada una era "raíz" de su propia red. Eso causaba dos problemas:

1. Su "Nivel 1" real (su primer invitado directo) no tenía ningún
   padre válido esperando si el nivel justo arriba de ellas todavía
   estaba vacío — no había manera limpia de "anclarlas" al árbol
   completo sin forzar un orden de llenado estricto (nivel 1 completo
   antes de abrir el nivel 2, etc.), que el cliente no quería imponer.
2. La cuenta del propio Administrador, al ver su "Red de Usuarios",
   no mostraba nada de la Red General — porque, en efecto, no estaba
   conectada a su árbol.

## La solución (idea del cliente)

Las 510 posiciones de los 8 niveles restringidos ahora se crean **ya
conectadas entre sí desde el día uno**, como usuarios "reservado"
(campo nuevo `User.reservado`, marcador de lugar sin acceso). Cuando
alguien se registra en un espacio restringido — por su cuenta o a
mano por el Administrador — el sistema **actualiza esa misma fila**
con los datos reales de esa persona (`reservado` pasa a `false`), en
vez de crear una fila nueva. La posición en el árbol nunca se mueve
ni depende del orden en que se vayan llenando los espacios.

## Qué se agregó / cambió

- **Campo nuevo:** `User.reservado` (boolean, default false).
- **Script nuevo (correr UNA VEZ):** `prisma/backfill-red-general.mjs`
  — conecta las 510 posiciones al árbol (con el Administrador como
  raíz), creando marcadores de lugar donde hace falta y reconectando
  a las personas que ya estaban registradas (sin tocar sus datos).
- **`src/lib/redUsuarios.ts`** — `obtenerArbolPorNiveles` ya no simula
  filas bloqueadas (como en el cambio anterior del 16 sept): ahora lee
  datos reales de la base, reservados o no. `contarTotalDb` excluye
  los reservados de los conteos. `eliminarDefinitivoDb` bloquea
  ("Eliminar definitivo + comprimir") sobre cualquier posición de la
  Red General — esa zona se administra solo desde el Panel de
  Administrador → Red General, nunca comprimiendo el árbol.
- **`src/app/api/registro/route.ts`** y
  **`src/app/api/admin/red-general/registrar/route.ts`** — al
  registrar a alguien en un espacio restringido, ya NO se crea un
  usuario nuevo: se actualiza la fila reservada correspondiente.
- **`src/app/api/admin/red-general/eliminar/route.ts`** ("Liberar
  este espacio") — ya no borra la cuenta ni la desvincula del árbol;
  resetea esa misma fila de vuelta a "reservado sin reclamar" (nuevo
  correo interno, sin contraseña), conservando su posición para que
  los espacios de abajo sigan conectados.
- **`src/components/RedUsuarios.tsx`** — un espacio reservado se ve
  con 🔒 junto al nombre y un color distinto; sigue siendo
  seleccionable (el Administrador puede ver sus datos superficiales:
  nivel y posición, ya incluidos en el nombre del marcador), pero sin
  las acciones de Marcar inactivo/Enviar al fondo/Eliminar.

## Caso especial: alguien ya estaba registrado bajo el Administrador

Si alguna persona real ya se había registrado usando el link personal
del Administrador **antes** de este cambio (quedando conectada
directamente bajo él, en el mismo lugar que ahora necesita el Espacio
1 de la Red General), el script `backfill-red-general.mjs` lo detecta
solo: la desconecta temporalmente (junto con toda su propia red hacia
abajo, que se mueve con ella automáticamente), arma primero los 510
espacios de la Red General, y al final la vuelve a insertar con la
misma búsqueda normal de espacio libre — así que cae exactamente donde
ya le habíamos explicado a Daniel que caería: en el primer lugar libre
a partir del nivel 9. No hace falta mover nada a mano ni correr nada
aparte; el script imprime en la terminal a quién reubicó y en dónde.

## Qué correr, en este orden

1. Aplica la migración (agrega la columna `reservado`):
   ```
   npx prisma migrate deploy
   ```
2. Corre el backfill — UNA SOLA VEZ, después de la migración:
   ```
   npm run db:backfill-red-general
   ```
   Es seguro correrlo más de una vez por error: si ya conectó todo,
   la segunda corrida no crea nada nuevo, solo confirma las conexiones.
3. Verifica que compile limpio:
   ```
   npx tsc --noEmit --skipLibCheck
   ```
4. Sube el código de siempre (`git add .` → `git commit` →
   `git push machtia main`).

## Verificación recomendada después de correr el backfill

Entra como Administrador a "Mis Referidos" / "Mi Red 2x15" — ya debe
aparecer el árbol completo de la Red General (con candados 🔒 en lo
que todavía nadie reclama, y las 3 personas que ya estaban
registradas — nivel 1, nivel 5 y nivel 7 — en su posición real).
