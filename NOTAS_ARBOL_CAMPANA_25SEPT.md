# Vista de árbol gráfico — Campaña de Lanzamiento (25 sept 2026)

Mientras esperamos respuesta del cliente sobre los demás pendientes,
implementamos el punto 6 de su lista ("vista de árbol gráfico para
Campaña de Lanzamiento") porque ya estaba claro y no dependía de más
información — el árbol de 8 ramas ya existe en la base de datos
desde el 18 de septiembre, solo faltaba la vista gráfica.

## Qué se agregó

En `/home/campana-lanzamiento`, arriba de "Tu red por nivel" ahora
hay un selector **Resumen / Árbol**:

- **Resumen:** la vista de barras que ya existía (cuántas personas
  hay en cada uno de los 5 niveles).
- **Árbol:** vista nueva, nodo por nodo, con el mismo estilo visual
  que ya existe en "Mi Red 2x15" — solo que aquí cada nivel tiene 8
  posiciones en vez de 2, porque así es la Campaña de Lanzamiento.

Es de solo lectura (aquí no se marca inactivo ni se elimina a nadie
— esas acciones administrativas siguen viviendo únicamente en "Mi
Red 2x15", que es el árbol real de la Red General).

## Base de datos

Esta ronda NO trae cambios de esquema — usa datos que ya existían
(`padreAlternaId`, `posicionEnPadreAlterna`). No hay que correr
`prisma migrate deploy`.

## Qué correr, en este orden

```
npm install
npx tsc --noEmit --skipLibCheck
git add .
git commit -m "Vista de arbol grafico para Campana de Lanzamiento"
git push machtia main
```
