# Ampliación de la Campaña de Lanzamiento al 30 de noviembre (27 oct 2026)

El cliente amplió la Red Alterna con el MISMO plan de ganancias (mismas
tablas y reglas) y confirmó:

1. La campaña cierra el **30 de noviembre de 2026, 10:00 p.m.** (hora Centro de México).
2. El año de las membresías empieza el **30 de noviembre**, a la hora en que
   termina la campaña → todas vencen el **30 de noviembre de 2027, 10:00 p.m.**
3. La Red General (2x15) arranca el **1 de diciembre de 2026**.

## Qué cambió

- `src/lib/redAlterna.ts`: fecha de cierre por defecto → `2026-11-30T22:00:00-06:00`
  (no hay variable `RED_ALTERNA_FIN_ISO` en Vercel que la sustituya).
- `src/components/CampanaLanzamiento.tsx` y `src/components/Dashboard.tsx`: cuenta
  regresiva y texto "Cierra: 30 de noviembre de 2026".
- `src/lib/membresia.ts`: `proximoVencimientoMembresia()` ahora alinea al 30 de
  noviembre 10:00 p.m. (hora Centro, UTC-6). Cualquier aprobación antes del
  cierre vence el 30 nov 2027; después, en el siguiente 30 de noviembre.
  Antes esta función daba el 30 de octubre de 2026 a quien se aprobaba antes
  del 30 de octubre (fecha corta, distinta al 2027 de los ya sincronizados).
- `prisma/sincronizar-membresias-30-noviembre.mjs` (nuevo,
  `npm run db:sincronizar-membresias-30-noviembre`): pone
  `membresiaExpiraEn = 30 nov 2027 22:00` a todos los usuarios ACTIVA.
  Solo toca esa fecha. Es idempotente.
- Scripts `simular-primer-invitado-restringidos` y `verificar-estado-red-alterna`:
  fecha de cierre por defecto actualizada.

## Orden para aplicarlo

1. `npm install` → `npx tsc --noEmit --skipLibCheck` → los 3 comandos de git → esperar el deploy.
2. DESPUÉS del deploy: `npm run db:sincronizar-membresias-30-noviembre`.

No hay migración de base de datos ni se regeneran regalías: la campaña
sigue corriendo y no se pierde nada. El pago simulado de nivel 1 para los
restringidos es único y ya se pagó; la ampliación no genera otro.
