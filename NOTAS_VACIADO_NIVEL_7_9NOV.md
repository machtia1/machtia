# Vaciado del nivel 7 en adelante (9 nov 2026)

Pedido del cliente: borrar a los usuarios que "se colaron" (nivel 7 en
adelante), conservar los niveles 1 al 6, guardar el acumulado de regalías
como punto de comparación y empezar a contar regalías de nuevo desde cero.
Los usuarios se vuelven a registrar con todo el proceso y suben su
comprobante otra vez. El respaldo se hace en archivos (sin contratar un
servicio extra en Aiven).

## Qué cambió en el código
- `prisma/exportar-base-completa.mjs` (`npm run db:exportar-todo`): exporta
  TODAS las tablas a CSV en `prisma/respaldos/exportacion-<fecha>/`, relee
  cada archivo y compara sus filas contra la base (`_RESUMEN.csv`). Solo lee.
- `prisma/vaciar-usuarios-nivel-7-en-adelante.mjs`
  (`npm run db:vaciar-usuarios-nivel-7`): modo prueba por defecto;
  `-- --ejecutar` para hacerlo de verdad. Exige una exportación completa
  reciente (24 h) con todas las tablas coincidiendo.
- Migración `20261109210000_respaldos_vaciado` + tablas
  `RespaldoUsuarioBorrado` y `RespaldoRegaliaRedAlterna` (copias sin llaves
  foráneas, con nombres y correos tal cual).
- Los restringidos pasan de 8 a 6 niveles en el panel (`MAX_NIVEL`).

## Orden
1. Desplegar (git) y `npx prisma migrate deploy`.
2. `npm run db:exportar-todo` → guardar la carpeta en un lugar seguro.
3. `npm run db:vaciar-usuarios-nivel-7` (prueba): revisar las listas.
4. `npm run db:vaciar-usuarios-nivel-7 -- --ejecutar`.
5. `npm run db:simular-primer-invitado-restringidos` (repone el pago simulado
   de nivel 1 a los restringidos sin invitados).

## Qué se conserva / qué se borra
- Se conservan: restringidos nivel 1-6, cualquier rol distinto de USUARIO o
  SOCIO (administrador, asistentes, profesores) y los correos que se pasen
  con `--conservar=a@x.com,b@y.com`.
- Se borran: el resto de usuarios, sus notificaciones, inscripciones a cursos
  y preregistros; los espacios restringidos de nivel 7 en adelante; y TODAS
  las regalías (ya respaldadas).

## Respaldos
- En archivos: `prisma/respaldos/` (exportación completa, regalías, acumulado
  por persona y usuarios borrados). Contienen datos personales: no se suben a
  git (`.gitignore`) y deben guardarse en un lugar seguro.
- En la base: tablas `Respaldo*` (campo `lote` = fecha y hora de la corrida).
- Aiven conserva además sus respaldos automáticos de unos 2 días.
- Limitación: restaurar la base completa a partir de CSV es más laborioso que
  restaurar una copia; el borrado de usuarios no tiene marcha atrás.

## Consecuencias
- Se pierde quién invitó a quién y las posiciones del árbol; al volver a
  registrarse, el orden de aprobación define dónde queda cada quien.
- Los links de invitación de los usuarios borrados dejan de servir; los de
  los restringidos 1-6 siguen sirviendo.
- Las regalías nuevas se generan normalmente al aprobar cada comprobante
  mientras la campaña siga activa (hasta el 30 nov 2026, 10 p.m.).
