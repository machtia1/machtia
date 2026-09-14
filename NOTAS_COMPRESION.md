# Cambios aplicados — Compresión "solo por la rama izquierda" (real)

## Qué se resolvió

Daniel mandó un diagrama exacto explicando la regla que faltaba, y
separó la acción en dos:
- **Eliminar**: saca la posición para siempre, sin reinsertar a nadie
- **Comprimir y enviar al fondo**: comprime la posición y reinserta
  a la persona al final de la red de quien la invitó originalmente

Antes de escribir el código, reproduje su ejemplo exacto (P→B→C→E→I)
en una simulación aparte y comparé resultado contra su diagrama,
campo por campo — coincide exacto. También probé el único caso que
su ejemplo no cubre (cuando el nodo que sube ya tenía su propio hijo
derecho) y quedó resuelto de forma segura: esa persona no se pierde,
se reinserta por invitación normal.

## Qué se agregó

**Nuevo en `src/lib/redUsuarios.ts`:**
- `eliminarDefinitivoDb(usuarioId)` — Eliminar
- `enviarAlFondoDb(usuarioId)` — Comprimir y enviar al fondo
- (internamente) `comprimirPosicion()` — el motor compartido por
  ambas, corre dentro de una transacción para que nunca quede el
  árbol a medio mover si algo falla a mitad de camino

**Nuevo:**
- `src/app/api/admin/red/eliminar/route.ts`
- `src/app/api/admin/red/enviar-al-fondo/route.ts`

**Modificado:**
- `src/components/RedUsuarios.tsx` — ya aparecen los dos botones
  (antes estaban ocultos con una nota de "pendiente de confirmar")

## Qué correr

Sin cambios al schema, no hace falta migración:

```
npm install
npx tsc --noEmit
git add .
git commit -m "Compresion real: Eliminar y Comprimir-enviar-al-fondo"
git push machtia main
```

## Cómo probar

1. Arma una red de prueba con al menos 4-5 personas para tener algo
   que comprimir (invita, aprueba cada una)
2. Entra a "Mi Red", selecciona a alguien que tenga gente debajo
3. Prueba "Comprimir y enviar al fondo" — su posición debería
   liberarse y comprimirse según la regla, y esa persona debería
   reaparecer al final de la fila de quien la invitó
4. Prueba "Eliminar definitivo" con otra persona — su posición se
   comprime igual, pero esa persona ya no vuelve a aparecer en el
   árbol
