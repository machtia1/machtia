# Rechazar una solicitud ya libera el correo para volver a intentarlo

(17 sept 2026 — pedido del cliente por WhatsApp)

## El problema

Al rechazar una solicitud desde el Panel de Aprobaciones, la fila
quedaba marcada `RECHAZADA` pero conservaba el correo real de la
persona para siempre. Como el correo es único en la base de datos,
esa persona nunca podía volver a registrarse con el mismo correo —
ni corrigiendo lo que causó el rechazo (por ejemplo, subir un mejor
comprobante de pago) — ni reusando el mismo link de confirmación que
ya había recibido por correo.

## La solución

`/api/admin/rechazar` ahora distingue dos casos:

- **Invitación normal** (link personal de alguien): como la posición
  en el árbol solo se asigna al **aprobar** (nunca antes), alguien
  rechazado todavía no tiene nada conectado bajo él — así que su fila
  se **borra por completo**. El link de confirmación original que ya
  tenía (Fase 1) se libera automáticamente, así que la persona puede
  volver a usar el mismo link y registrarse de nuevo con el mismo
  correo.
  - Caso residual: si alguien ya alcanzó a usar SU link de invitación
    antes de ser rechazado (edge case poco probable dado lo corto que
    suele ser el tiempo de revisión), su fila no se borra —para no
    perder esa referencia— pero sí se libera el correo.
- **Espacio restringido de la Red General**: su posición en el árbol
  es fija y la necesitan los espacios de abajo para seguir
  conectados, así que la fila **no se borra** — se resetea de vuelta
  a "reservado sin reclamar", exactamente el mismo mecanismo que
  "Liberar este espacio" en Panel de Administrador → Red General.
  Libera el correo real que tenía.

## Qué correr

Ningún cambio de esquema ni migración — es solo lógica de la API.
Con validar `npx tsc --noEmit --skipLibCheck` y subir el código de
siempre es suficiente.
