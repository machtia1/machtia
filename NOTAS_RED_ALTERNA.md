# Cambios aplicados — Motor de Regalías, Red Alterna (Campaña de Lanzamiento)

## ⚠️ Importante — qué SÍ y qué NO hace esto todavía

Este motor calcula y guarda las regalías correctamente, pero **no se
dispara solo todavía**, porque el punto donde se activaría (cuando
se aprueba el comprobante de pago de una suscripción) sigue siendo
un pendiente en tu roadmap: "Panel para aprobar comprobantes de pago
y activar cuentas". En cuanto construyas esa parte, solo hay que
llamar a `registrarRegaliasRedAlterna(usuarioId)` justo cuando se
aprueba el pago — una sola línea.

Por ahora, lo que sí puedes probar es el endpoint que consulta el
resumen de regalías de un usuario (te va a devolver todo en $0
mientras no haya suscripciones aprobadas de verdad).

## Reglas de negocio implementadas (confirmadas con Daniel el 13 sept)

- Red General y Red Alterna se llenan con la MISMA cadena real de
  invitaciones (no hay árbol de 8 ramas forzado — el cliente aclaró
  que "participan todos sin restricción")
- Se paga hasta 5 niveles hacia arriba en esa cadena
- La tabla aplicada es la del nivel MÁS BAJO entre quien gana y quien
  se suscribió (nadie gana más de lo que su propio nivel permite)
- La Red Alterna deja de contar el 30 de octubre (configurable por
  variable de entorno `RED_ALTERNA_FIN_ISO`, ver abajo)

Verifiqué la matriz completa de 9 combinaciones posibles
(Básica/Plus/Negocios × Básica/Plus/Negocios) contra los 6 casos que
confirmó el cliente por WhatsApp — coinciden exactamente.

## Qué se agregó

**Nuevo modelo en la base de datos:**
- `RegaliaRedAlterna` — un registro por cada regalía pagada (quién la
  ganó, quién la generó, en qué nivel, cuánto, con qué tabla)

**Nuevo:**
- `src/lib/redAlterna.ts` — el motor: `registrarRegaliasRedAlterna()`
  (calcula y guarda) y `resumenRegaliasUsuario()` (para mostrar en el
  Dashboard)
- `src/app/api/campana/mis-regalias/route.ts` — endpoint que devuelve
  el resumen de regalías del usuario logueado

## Qué correr, en este orden

1. Aplica la migración (crea la tabla nueva en Aiven):
   ```
   npx prisma migrate dev --name red_alterna_regalias
   ```

2. Verifica que compile limpio (los 3 errores de "regaliaRedAlterna
   does not exist" que viste antes de este paso deben desaparecer):
   ```
   npx tsc --noEmit
   ```

3. Sube todo:
   ```
   git add .
   git commit -m "Motor de regalias Red Alterna - campaña de lanzamiento"
   git push machtia main
   ```

## Pendiente de tu parte (no técnico)

- Confirma con Daniel la hora EXACTA del 30 de octubre (ahora mismo
  quedó en `2026-10-30T06:00:00-06:00` como valor por defecto —
  cámbialo agregando `RED_ALTERNA_FIN_ISO` a tu `.env` y a las
  variables de entorno de Vercel si la hora exacta es otra)
- Este motor todavía no puede probarse con datos reales de punta a
  punta porque depende del Registro Fase 2 + aprobación de pagos,
  que siguen pendientes en tu roadmap

## Actualización — fechas confirmadas (13 sept 2026, tarde)

Daniel confirmó las fechas exactas de la campaña:
- **Inicio:** lunes 14 de septiembre 2026, 10:00 PM hora Centro de México
- **Corte:** 30 de octubre 2026, 10:00 PM hora Centro de México

Se actualizó `src/lib/redAlterna.ts` con ambas fechas exactas (antes
solo tenía la fecha de corte con una hora temporal de 6:00 AM). La
función `redAlternaActiva()` ahora también valida que ya haya
empezado la campaña, no solo que no haya terminado.

## Otras confirmaciones del cliente (no requieren cambios de código)

- **Vigencia del contrato:** enero 2027 (fecha del 4to pago). Las
  regalías continúan de forma indefinida después de esa fecha. Al
  terminar, se puede firmar un contrato nuevo para desarrollos
  posteriores.
- **Monto del bono final:** se confirma después del primer pago,
  puede ser de hasta $8,500 MXN.
- Estos dos puntos son administrativos/contractuales — vale la pena
  dejarlos por escrito en el contrato mismo, no solo en WhatsApp.
