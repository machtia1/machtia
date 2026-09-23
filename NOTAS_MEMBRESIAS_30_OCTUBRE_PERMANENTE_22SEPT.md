# Regla permanente: membresías sincronizadas al 30 de octubre (22 sept 2026)

## Qué se pidió

El cliente confirmó: "Aplica la fecha para todos, 30 de Octubre
empiezan a correr los 365" — es decir, ya no solo un ajuste de una
sola vez para quienes ya estaban activos (eso se hizo el 22 sept con
el script `db:sincronizar-membresias-30-octubre`), sino que **de aquí
en adelante, TODAS las aprobaciones nuevas también se sincronizan al
30 de octubre**, en vez de tener cada quien su propia fecha de
vencimiento según el día que se aprobó.

## Qué se cambió

Se creó `src/lib/membresia.ts` con la función
`proximoVencimientoMembresia()`, y se usa ahora en los dos lugares
donde se activa una membresía:

- `/api/admin/aprobar` (aprobación normal de una solicitud).
- `/api/admin/red-general/registrar` (cuando alguien reclama un
  espacio de la Red General/niveles 1-8).

La regla:
- Si a alguien se le aprueba ANTES del 30 de octubre de este año, su
  membresía vence el 30 de octubre de ESTE año (para que quede
  sincronizado con el ciclo que ya está por arrancar).
- Si se le aprueba el 30 de octubre o después, su membresía vence el
  30 de octubre del año QUE SIGUE (un ciclo completo).

**Ojo — un detalle a tener presente:** con esta regla, alguien que se
apruebe, por ejemplo, HOY (22 de septiembre) vence el 30 de octubre
de este mismo año — es decir, con menos de 365 días de membresía esta
primera vez, porque es justo el momento en el que arranca la
sincronización de todos al mismo calendario. De ahí en adelante, cada
renovación sí les da el año completo. Si esto no es lo que quieren
para quienes se aprueben en las próximas semanas (antes del 30 de
octubre), avísenme y lo ajustamos.

## Qué NO cambió

- El script de una sola vez que ya se corrió (`db:sincronizar-membresias-30-octubre`)
  no se vuelve a correr — esto solo cambia la regla para lo que
  pase de ahora en adelante.
- No se tocó ninguna otra parte del flujo de aprobación (Red de
  Usuarios, Red Alterna, notificaciones, regalías) — solo el cálculo
  de la fecha de vencimiento.

## Qué correr, en este orden

```
npm install
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Sincronizar membresias nuevas al 30 de octubre de forma permanente"
git push machtia main
```

(No hay cambios de base de datos esta ronda — no hace falta correr
ningún script ni `npx prisma migrate deploy`.)
