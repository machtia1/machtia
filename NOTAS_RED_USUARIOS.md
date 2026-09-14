# Cambios aplicados — Red de Usuarios + Red General (Elemento 2) real

## ✅ Lo que SÍ quedó conectado a la base de datos real

1. **Inserción BFS de nuevos usuarios** — cuando apruebas un registro
   en el Panel de Aprobaciones, esa persona ahora se coloca de verdad
   en la Red de Usuarios (árbol binario) de quien la invitó. Probé
   la lógica exhaustivamente contra el ejemplo original del cliente
   antes de conectarla — coincide exactamente.
2. **Vista real de "Mi Red"** — cualquier usuario ve su propia red
   hasta 15 niveles, con datos reales (ya no un ejemplo fijo).
3. **Marcar cuenta inactiva** — acción real del Administrador,
   conserva la posición de la persona en el árbol.
4. **Panel de Administrador (Red General, los primeros 8 niveles
   restringidos)** — completamente real: genera links de invitación
   de verdad, los guarda en la base de datos, y permite registrar
   manualmente a quien ocupa cada espacio.
5. Se agregó una restricción a nivel de base de datos que impide que
   dos personas ocupen el mismo espacio del árbol por accidente, ni
   siquiera si dos registros se aprueban al mismo tiempo.

## ⚠️ Lo que NO quedó conectado todavía (a propósito)

**"Eliminar definitivo + comprimir" y "Enviar al fondo" (Administrador).**

Al traducir esta parte a la base de datos real encontré dos problemas
que prefiero resolver contigo antes de arriesgar posiciones reales de
gente (y dinero, una vez que la Red General empiece a contar el 30
de octubre):

- El propio código original ya advertía en un comentario que la regla
  para el sub-árbol derecho del nodo eliminado no estaba 100%
  confirmada con el cliente.
- Al probar la lógica paso a paso until encontré un caso real donde
  el comportamiento se vuelve ambiguo (qué pasa cuando la persona que
  sube a ocupar el lugar del eliminado ya tenía su propio hijo en esa
  misma posición).

Mientras tanto, estas dos acciones están **ocultas** en la pantalla
real (no aparecen botones para ellas) — no se perdió nada, solo no
están disponibles hasta confirmar la regla exacta. Marcar inactivo sí
funciona normal, que es lo que se usa el 99% del tiempo.

## Otra cosa a tener en cuenta

Cuando el Administrador registra manualmente a alguien en un espacio
restringido (los primeros 8 niveles), esa cuenta se crea sin
contraseña todavía — no hay forma de que esa persona inicie sesión
hasta que se construya un flujo de "crear tu contraseña" (parecido a
un "olvidé mi contraseña"). Es un pendiente pequeño, aparte.

## Qué correr

Esta vez SÍ hay un cambio al schema (la restricción única):

```
npx prisma migrate dev --name red_usuarios_unica
npx tsc --noEmit
git add .
git commit -m "Red de Usuarios y Red General conectadas a la base de datos real"
git push machtia main
```

## Cómo probar

1. Completa un registro de prueba y apruébalo en "Aprobar registros"
2. Entra a "Mi Red" (o "Red 2x15") en el menú — como esa persona fue
   invitada por ti, debería aparecer en tu árbol
3. Entra al "Panel de Administrador" (Red General) — genera un link
   para el Espacio 1 del Nivel 1, y regístralo manualmente con datos
   de prueba — debería quedar "Ocupado" de verdad, y seguir así si
   recargas la página
