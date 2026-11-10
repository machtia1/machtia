// Funciones auxiliares para escribir respaldos en CSV (se usan en
// prisma/exportar-base-completa.mjs). Sin dependencias externas.

/** Convierte cualquier valor de la base a texto para una celda CSV. */
export function valorACelda(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'object') {
    // Decimal de Prisma (decimal.js): se reconoce porque tiene toFixed y
    // se escribe como número plano, sin comillas (ej. 10 o 12.5).
    if (typeof v.toFixed === 'function' && typeof v.toNumber === 'function') {
      return v.toString();
    }
    return JSON.stringify(v);
  }
  return String(v);
}

/** Escapa una celda según las reglas de CSV (comillas, comas, saltos de línea). */
export function csvCelda(v) {
  const s = valorACelda(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Arma el texto completo de un CSV (con BOM para que Excel respete acentos). */
export function armarCsv(columnas, filas) {
  const lineas = [columnas.join(',')];
  for (const fila of filas) {
    lineas.push(columnas.map((c) => csvCelda(fila[c])).join(','));
  }
  return '﻿' + lineas.join('\n') + '\n';
}

/**
 * Cuenta cuántas filas de datos tiene un CSV ya escrito, leyendo el
 * texto y respetando saltos de línea dentro de celdas entrecomilladas.
 */
export function contarFilasCsv(texto) {
  let filas = 0;
  let enComillas = false;
  let hayContenidoEnLinea = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      if (enComillas && texto[i + 1] === '"') {
        i++;
      } else {
        enComillas = !enComillas;
      }
      hayContenidoEnLinea = true;
    } else if (c === '\n' && !enComillas) {
      if (hayContenidoEnLinea) filas++;
      hayContenidoEnLinea = false;
    } else if (c !== '\r' && c !== '﻿') {
      hayContenidoEnLinea = true;
    }
  }
  if (hayContenidoEnLinea) filas++;
  return Math.max(0, filas - 1); // quita el encabezado
}
