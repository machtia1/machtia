# Rediseño de registro + nueva sección Publicidad (25 sept 2026)

## 1. Registro combinado con el diseño del Login

El preregistro (`InvitacionLanding.tsx`, paso 1 — nombre y correo) y el
registro completo (`RegistroCompleto.tsx`, paso 2 — apellido, país,
teléfono, suscripción, contraseña, comprobante) ahora usan el mismo
lenguaje visual que el Login ya entregado: fondo azul marino con
resplandor, tarjeta con blur y gradiente, etiquetas en mayúsculas tipo
"eyebrow", campos con borde que se ilumina en celeste al enfocar, y
botón de acción con el mismo degradado celeste→índigo.

Toda la lógica, validaciones y llamadas a la API se mantienen
exactamente igual — solo cambió la apariencia.

## 2. Nueva sección "Publicidad"

Carrusel de hasta 8 imágenes en formato publicación de Facebook
(recomendado 1200×630px), que cualquier usuario puede ver y descargar
desde el menú lateral → Publicidad, para promocionar el negocio en
sus redes.

- **Para el Administrador:** Panel de Administrador → pestaña
  "Publicidad" (`/home/publicidad-admin`). Ahí se suben las imágenes
  (máximo 8), se reordenan con las flechas, se desactivan o se
  eliminan.
- **Para todos los usuarios:** menú lateral → "Publicidad"
  (`/home/publicidad`). Carrusel que avanza solo cada 5 segundos, con
  flechas para moverlo a mano y un botón "Descargar" en cada imagen.

## Base de datos

Esta ronda trae un cambio de esquema (tabla nueva
`PublicidadImagen`) — hay que correr `npx prisma migrate deploy`.

## Qué correr, en este orden

```
npm install
npx prisma migrate deploy
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Registro combinado con el diseno del login y nueva seccion Publicidad"
git push machtia main
```

No hay script de base de datos que correr aparte esta vez (no se
tocan datos existentes, solo se agrega la tabla nueva, vacía).
