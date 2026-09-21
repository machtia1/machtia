# Cambios del "Análisis de avances" del cliente (20 sept 2026)

Se dejó la Página de Log In para el final (pendiente, no incluido en
esta entrega). Todo lo demás quedó implementado y probado:

## Página de inicio (Dashboard)

- **Texto que se sale de recuadros / scroll innecesario**: se corrigió
  el link de invitación (URL larga) y el texto de anuncios para que
  se ajusten dentro de su caja (`break-all`/`break-words`) en vez de
  desbordarse, y se bloqueó el desbordamiento horizontal general de
  la página.
- **El menú desplegable no se cerraba**: ahora tiene botón "X" para
  cerrarlo, un fondo oscuro detrás que lo cierra al tocarlo, y se
  cierra automáticamente al elegir cualquier opción.
- **El menú desplazaba también la pantalla de inicio**: se bloqueó el
  scroll de la página de fondo mientras el menú está abierto en
  celular/tablet — ahora son dos scrolls independientes.
- **Ícono de carga animado del logo**: nuevo componente
  (`LoadingLogo`) que reemplaza TODOS los textos planos de
  "Cargando..." de la plataforma (Dashboard, Mi Red, Mis Logros, Mis
  Ganancias, Panel de Aprobaciones, Usuarios, Red General, Anuncios,
  Registro, Recuperar contraseña) por el logo animado.
- **Iconos en el menú**: cada elemento del menú lateral (Mi Oficina,
  Mi Red, Cursos, Talleres, etc., y sus sub-secciones) ahora tiene un
  ícono que ayuda a identificarlo de un vistazo.
- **Anuncios con imagen o video**: el formulario de "Nuevo anuncio" en
  Panel de Administrador → Anuncios ahora permite subir una imagen o
  un video corto opcional, que se muestra dentro de la tarjeta del
  anuncio en el Dashboard de todos los usuarios.
  - Imagen: máx. 5 MB, JPG/PNG/WEBP (recomendado 1200×630px).
  - Video: máx. 25 MB, MP4/WEBM (ideal 15-30 segundos de duración).
- **"Crear notificación" para el Administrador**: nueva sección dentro
  de Panel de Administrador → Anuncios. A diferencia de los anuncios
  (que se ven en la tarjeta del Dashboard), una notificación aparece
  directo en la campanita 🔔 del encabezado de TODOS los usuarios,
  con un punto rojo mientras no la hayan abierto.

## Qué se agregó en la base de datos

- `Anuncio.mediaUrl` / `Anuncio.mediaTipo` (imagen o video opcional).
- Modelo nuevo `Notificacion` (mensaje + fecha).
- `User.ultimaNotificacionVistaEn` — para saber si cada usuario tiene
  notificaciones sin leer.

## Qué correr, en este orden

```
npm install
npx prisma migrate deploy
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Analisis de avances: menu, carga animada, anuncios con media, notificaciones"
git push machtia main
```

## Pendiente (no incluido, a propósito)

- **Página de Log In**: animación de identidad, verificar recuperar
  contraseña, responsivo, y el texto "vamos por la versión 2.2" — el
  cliente mandó un video de ejemplo de cómo la imagina. Se deja para
  la siguiente ronda, tal como pediste.
- **Resetear las ganancias acumuladas**: quedó pendiente de que el
  cliente confirme exactamente qué se debe borrar (¿todas las
  regalías, o solo las de antes del 18 sept?) — es una acción sobre
  dinero real que no se puede deshacer, así que no se tocó todavía.
