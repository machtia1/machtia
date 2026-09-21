# Rediseño del Login — igual al video de ejemplo (20 sept 2026)

## Qué se pidió

El cliente mandó un video de ejemplo (login con fondo azul marino,
escudo animado con íconos orbitando, tarjeta de acceso tipo "hoja
deslizante") y pidió que el Login quedara **exactamente igual** a ese
diseño y esa animación, tanto en celular como en computadora, pero
conservando el 100% de lo que el Login ya hace hoy.

## Qué se cambió

Se reescribió por completo `src/components/VantageLogin.tsx` (el
componente que ya usa `src/app/page.tsx`, no hubo que tocar ningún
otro archivo de rutas). El diseño anterior (video de fondo + texto de
marketing tipo "hero") se reemplazó por:

- Fondo azul marino oscuro con resplandor sutil.
- Header con el logo de Club Machtia (blanco) y "Ayuda".
- Escudo/copo de nieve animado en el centro, con 4 íconos (los mismos
  temas del video: gestión, dispositivos, crecimiento, contenido)
  orbitando alrededor en dos anillos — animación continua en CSS,
  igual que el video.
- Textos "Una sola cuenta" / "Todo conectado. Todo en Machtia." tal
  como aparecen en el video.
- Tarjeta de acceso tipo "hoja deslizante" (con animación de entrada
  desde abajo) con "Acceso seguro" / "Bienvenido de vuelta" /
  "Continúa en tu cuenta Club Machtia.", los campos de Correo y
  Contraseña (con el botón azul circular para mostrar/ocultar), el
  link "¿Olvidaste tu contraseña?", el botón de "Ingresar" con
  degradado, y "Conexión protegida" al pie — todo igual al video.
- Al iniciar sesión correctamente, el botón cambia un instante a
  verde "Acceso confirmado ✓" antes de entrar (igual que el cierre
  del video), y luego pasa a /home como siempre.
- En computadora (pantallas anchas) el diseño se acomoda en dos
  columnas — el escudo animado a la izquierda y la tarjeta a la
  derecha — porque una "hoja deslizante" estirada a todo el ancho de
  una pantalla de computadora se vería rota; pero son exactamente los
  mismos elementos, mismos colores, misma animación y mismo texto que
  en celular, solo acomodados para que se vea bien en pantalla ancha.

## Qué NO cambió (funcionalidad 100% igual a la que ya tenía)

- Login con correo + contraseña contra `/api/auth/login`.
- Mostrar/ocultar contraseña.
- Mensaje de error si el correo o la contraseña están mal.
- Estado de "Entrando..." mientras carga.
- Link "¿Olvidaste tu contraseña?" → `/recuperar`.
- Redirección a `/home` al iniciar sesión.

## Base de datos

Ningún cambio de esquema en esta ronda — no hace falta correr
`npx prisma migrate deploy`.

## Qué correr, en este orden

```
npm install
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Rediseno del login igual al video de ejemplo"
git push machtia main
```
