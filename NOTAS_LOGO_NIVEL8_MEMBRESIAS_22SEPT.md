# Logo nuevo, apertura del nivel 8 y sincronización de membresías (22 sept 2026)

## 1. Logo nuevo

El cliente mandó el logo nuevo (mismo escudo/paleta de colores, cambia
el nombre por el tema de IMPI) y pidió "ir transformando los
elementos a este logo". Se reemplazaron los 3 archivos de marca que
ya usaba el proyecto, en el mismo lugar y con el mismo nombre, para
que no hiciera falta tocar ningún componente:

- `public/brand/icon-color.png` — el escudo/copo de nieve solo.
- `public/brand/logo-lockup-color.png` — escudo + texto, a color
  (para fondos claros, ej. la barra lateral del Dashboard).
- `public/brand/logo-lockup-white.png` — la misma versión, en blanco
  (para fondos oscuros, ej. el Login).

Se ajustó el tamaño reservado del logo en el Login (`VantageLogin.tsx`)
para que coincida con la proporción real del nuevo logo (es más
ancho que el anterior) y no se vea distorsionado.

Esto es solo el logo — el nombre "Club Machtia" en los textos del
sitio todavía NO se cambió (eso es la migración de dominio/nombre que
se platicó por separado, pendiente de que confirmen el nombre y
dominio definitivos).

## 2. Apertura del nivel 8 de la Red General

Se aplicó la opción que el cliente eligió: quitar el bloqueo sin
tocar ningún dato real. Se agregó el script
`prisma/liberar-nivel-8.mjs` (`npm run db:liberar-nivel-8`):

- Borra únicamente los espacios de nivel 8 que TODAVÍA NADIE reclamó
  (son filas "placeholder" que solo existen para tener la posición
  conectada desde el día uno — no son personas reales).
- Al desaparecer esa fila, la posición queda realmente vacía y el
  registro normal (por link de invitación, igual que el nivel 9 en
  adelante) la puede llenar solo — ya no hace falta que el
  Administrador genere una invitación específica para nivel 8.
- La persona que el cliente mencionó que ya está en el nivel 8 NO se
  toca — su información se queda exactamente igual, en su posición.
- Por seguridad, si algún espacio sin reclamar ya tuviera algo
  enganchado (alguien debajo, invitados, regalías), el script NO lo
  borra — lo reporta en la consola para revisar a mano, en vez de
  arriesgar datos reales.
- No afecta a los niveles 1-7, solo al nivel 8.

⚠️ Es una acción irreversible sobre la estructura del árbol — se
corre UNA sola vez, al final, después de subir el código.

## 3. Sincronizar las membresías al 30 de octubre

Se agregó el script `prisma/sincronizar-membresias-30-octubre.mjs`
(`npm run db:sincronizar-membresias-30-octubre`):

- A TODOS los usuarios con membresía ACTIVA les pone la fecha de
  vencimiento en **30 de octubre de 2027** — un año completo desde
  el 30 de octubre de 2026 (la fecha en la que, según el cliente,
  "empieza a contar" el año de membresía) — sin importar el día en
  que cada quien se haya aprobado originalmente.
- No toca el status de nadie, ni su posición en ningún árbol, ni
  ganancias — solo la fecha de vencimiento.

**Ojo — punto a confirmar con el cliente:** este script sincroniza a
quienes YA están activos hoy. Las aprobaciones NUEVAS que se hagan a
partir de ahora siguen usando la regla de "365 días desde el día que
se aprueban" (sin cambios en `/api/admin/aprobar`). Si también
quieren que las aprobaciones nuevas, de aquí en adelante, quedan
sincronizadas al 30 de octubre de cada año (en vez de su propia
fecha individual), avisen y se ajusta esa parte del código también.

## Qué correr, en este orden

```
npm install
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Logo nuevo, apertura de nivel 8 y sincronizacion de membresias al 30 de octubre"
git push machtia main
npm run db:liberar-nivel-8
npm run db:sincronizar-membresias-30-octubre
```

(Los dos scripts de base de datos van al final, después de subir el
código, como siempre — así si algo falla en tsc se detecta antes de
tocar datos reales.)
