# Cambios aplicados — Panel de Aprobaciones (Admin)

## Qué se agregó

**Nuevo:**
- `src/app/home/aprobaciones/layout.tsx` — protege la ruta, solo
  Administrador puede entrar
- `src/app/home/aprobaciones/page.tsx` + `PanelAprobaciones.tsx` — la
  pantalla: lista los registros pendientes con todos sus datos, link
  al comprobante de pago, y botones Aprobar/Rechazar
- `src/app/api/admin/pendientes/route.ts` — lista los usuarios en
  estado `PENDIENTE_APROBACION`
- `src/app/api/admin/aprobar/route.ts` — activa la cuenta (status →
  `ACTIVA`) y **dispara el motor de regalías de la Red Alterna** en
  ese mismo momento (justo como confirmó Daniel)
- `src/app/api/admin/rechazar/route.ts` — marca la cuenta como
  `RECHAZADA`

**Modificado:**
- `src/components/Dashboard.tsx` — se agregó el link "Aprobar
  registros" en el menú, junto al Panel de Administrador existente
  (solo visible para el rol Administrador)

Los 3 endpoints verifican el rol del lado del servidor, no solo por
la ruta protegida — aunque alguien manipulara el frontend, no podría
aprobar ni rechazar nada sin ser Administrador de verdad.

## Qué correr

No hay cambios al schema esta vez, así que no hace falta migración.

```
npm install
npx tsc --noEmit
git add .
git commit -m "Panel de aprobaciones: activa cuentas y dispara regalias"
git push machtia main
```

## Cómo probar

1. Completa un registro de prueba en `/invitacion/<tu-linkInvitacion>`
   (igual que hiciste con Registro Fase 2)
2. Inicia sesión como Admin y entra a "Aprobar registros" en el menú
3. Deberías ver esa persona en la lista, con su comprobante
4. Dale "Aprobar"
5. Entra a Prisma Studio y revisa: el `User.status` debe decir
   `ACTIVA`, y si la fecha está dentro de la ventana de la campaña
   (14 sept 10pm → 30 oct 10pm), debería haber aparecido una fila
   nueva en `RegaliaRedAlterna` para quien lo invitó (si esa persona
   tiene una suscripción Básica/Plus/Negocios asignada)

## ⚠️ Pendiente importante — todavía NO conectado

El registro real (Fase 2) todavía **no asigna posición en el árbol
binario de la Red de Usuarios** — ese usuario queda con
`invitadoPorId` guardado (para las regalías), pero sin `padreRedId`
ni `ladoEnPadre` asignados. Conectar la Red de Usuarios y el Panel de
Administrador (Red General) a la base de datos real es el siguiente
pendiente grande — merece su propio enfoque dedicado, no meterlo de
prisa junto con esto.
