# Notificaciones personales + navegación entre pantallas de Admin + reset de ganancias (20 sept 2026)

## 1. Reset de ganancias — CONFIRMADO por el cliente: "de cero a partir de hoy"

Se agregó `prisma/reset-ganancias-red-alterna.mjs`: borra TODAS las
regalías (`RegaliaRedAlterna`) generadas hasta ahora. No toca las
posiciones del árbol de nadie — solo el historial de comisiones. A
partir de correrlo, todas las "Mis Ganancias" de todos los usuarios
vuelven a $0, y las aprobaciones nuevas siguen generando regalías con
toda normalidad.

⚠️ Es una acción irreversible sobre dinero real — se corre UNA sola
vez, con `npm run db:reset-ganancias-red-alterna`.

## 2. Notificaciones personales (por usuario)

Nuevo modelo `NotificacionUsuario`, distinto del `Notificacion`
general del Administrador. Se generan automáticamente en el momento
de **aprobar** una solicitud (`/api/admin/aprobar`), que es cuando ya
es real tanto la invitación directa como la posición en el árbol:

1. A quien invitó directamente con su link → "🎉 &lt;nombre&gt; se
   unió como tu invitado directo con tu link de invitación."
2. A quien le tocó como padre exacto en la Red 2x15 (`padreRedId`) →
   "🌐 &lt;nombre&gt; se unió a tu Red 2x15."

Ojo: estos dos NO siempre son la misma persona — si el nivel 1 de
quien invitó ya está lleno, el árbol acomoda al nuevo usuario más
abajo en esa misma rama (regla de "desborde" que ya existía), así que
la notificación #2 le llega a quien de verdad quedó como su padre en
el árbol, no necesariamente a quien lo invitó.

Ambas aparecen en la campanita 🔔 del Dashboard, junto con los avisos
generales del Administrador, ordenadas por fecha. El punto rojo se
quita al abrir el panel.

## 3. Navegación entre pantallas de Administrador

"La parte de Anuncios y su edición no aparecen en el perfil de
Administrador": se agregó una barra de pestañas (`AdminTabs`) al
inicio de las 4 pantallas de administración (Red General, Aprobar
registros, Usuarios, Anuncios), para poder saltar de una a otra sin
depender solo del menú lateral.

## Qué se agregó en la base de datos

- Modelo nuevo `NotificacionUsuario` (destinatarioId, mensaje, leída, fecha).

## Qué correr, en este orden

```
npm install
npx prisma migrate deploy
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Notificaciones personales, navegacion admin y reset de ganancias"
git push machtia main
npm run db:reset-ganancias-red-alterna
```

(El reset de ganancias va AL FINAL, después de subir el código —
así ya queda registrado en el commit, y si algo sale mal en la
migración/tsc se detecta antes de borrar nada de dinero real.)
