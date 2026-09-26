# Botón de Campaña de Lanzamiento "no carga" en computadora (26 sept 2026)

## Lo que confirmó el cliente

- El punto de "1 en nivel 1 sin invitados" (punto 7 de su lista): revisó y
  no hay ningún detalle raro — queda cerrado, no hay nada que corregir ahí.
- El botón de Campaña de Lanzamiento: al darle clic desde computadora,
  simplemente no carga la sección.

## Qué encontramos (segunda revisión a fondo)

Revisamos el botón por segunda vez, completo: es un link normal de
Next.js (`<Link href="/home/campana-lanzamiento">`), sin ningún
código especial, sin `onClick`, sin nada que pudiera bloquearlo — el
mismo botón existe tanto para computadora como para celular, y ambos
usan exactamente el mismo código. No encontramos un error de
programación.

**Explicación más probable:** hoy subimos el proyecto muchas veces
seguidas (cada corrección = un despliegue nuevo en Vercel). Next.js
normalmente navega entre secciones sin recargar la página completa,
pidiendo pequeños archivos de JavaScript por sección. Si el
navegador de alguien ya tenía la página abierta ANTES de que
subiéramos una actualización, al hacer clic intenta pedir un archivo
que en el servidor ya no existe (porque cambió con el despliegue
nuevo) — y eso se ve exactamente como "hice clic y no pasó nada", sin
ningún aviso.

## Qué se agregó (para que esto no vuelva a pasar)

1. **Pantalla de carga propia** para Campaña de Lanzamiento — si
   tarda en cargar, ahora se ve un ícono girando en vez de una
   pantalla en blanco.
2. **Pantalla de error propia** para esa misma sección — si algo
   falla al cargar, ahora aparece un aviso claro con un botón
   "Reintentar" y otro para "Recargar página", en vez de quedarse
   trabado en silencio.
3. **Guardia contra este tipo de error en TODA la plataforma** — si
   el navegador de alguien detecta este problema específico
   (versión vieja en caché tras un despliegue nuevo) en cualquier
   sección, ahora se recarga la página automáticamente UNA sola vez,
   sin que la persona tenga que hacerlo a mano.

Con esto, si el problema vuelve a aparecer alguna vez (por ejemplo
justo después de que subamos una actualización), la plataforma se
recupera sola en vez de quedarse en blanco.

## Qué correr, en este orden

```
npm install
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Blindaje contra pagina en blanco tras despliegue (boton Campana de Lanzamiento)"
git push machtia main
```

No hay cambios de base de datos esta vez.
