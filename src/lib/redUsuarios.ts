import { prisma } from './prisma';

// ============================================================
// Club Machtia — Elemento 2: Red de Usuarios (árbol binario 2x15)
// contra la base de datos real.
// ------------------------------------------------------------
// Reglas (idénticas a la simulación en memoria que ya existía en
// network.ts, verificadas de nuevo aquí antes de conectarlas):
//
// 1. Inserción BFS: se agota un nivel completo (izquierda a
//    derecha) antes de pasar al siguiente, dentro de la red del
//    invitador.
// 2. Un usuario común ve hasta 15 niveles a partir de su propia
//    posición.
// 3. Cuenta inactiva: conserva su posición (no se mueve de lugar).
//
// NOTA IMPORTANTE: la eliminación definitiva con "compresión
// dinámica" y la acción "enviar al fondo" del Administrador NO
// están implementadas todavía contra la base de datos real. El
// propio código original (network.ts) ya advertía que la regla
// exacta para el sub-árbol derecho del nodo eliminado no estaba
// confirmada con el cliente, y al traducir esa lógica aquí se
// encontró un caso donde el comportamiento original es ambiguo.
// Como esto puede reacomodar posiciones reales de gente (y dinero,
// una vez que la Red General empiece a contabilizar el 30 de
// octubre), se dejó pendiente hasta confirmar la regla exacta —
// ver NOTAS_RED_USUARIOS.md.
// ============================================================

export interface NodoRed {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
  ladoEnPadre: 'IZQUIERDA' | 'DERECHA' | null;
}

const MAX_INTENTOS_INSERCION = 5;

/**
 * Inserta `nuevoUsuarioId` dentro de la red de `raizId`, siguiendo
 * la regla de llenado BFS (izquierda a derecha, nivel por nivel).
 * Es segura ante inserciones concurrentes: si dos personas se
 * registran al mismo tiempo bajo el mismo invitador, la restricción
 * única de la base de datos evita que ocupen el mismo espacio — en
 * ese caso, se vuelve a intentar buscando el siguiente espacio libre.
 */
export async function insertarEnRedUsuarios(
  raizId: string,
  nuevoUsuarioId: string,
  maxNiveles = 15
): Promise<{ ok: boolean; motivo?: string }> {
  for (let intento = 0; intento < MAX_INTENTOS_INSERCION; intento++) {
    const destino = await buscarEspacioLibre(raizId, maxNiveles);
    if (!destino) {
      return { ok: false, motivo: 'La red alcanzó el máximo de niveles visibles.' };
    }

    try {
      await prisma.user.update({
        where: { id: nuevoUsuarioId },
        data: { padreRedId: destino.padreId, ladoEnPadre: destino.lado },
      });
      return { ok: true };
    } catch (error: any) {
      // P2002 = choque de restricción única: alguien más ocupó ese
      // espacio en el instante entre que lo buscamos y lo asignamos.
      if (error?.code === 'P2002' && intento < MAX_INTENTOS_INSERCION - 1) {
        continue;
      }
      throw error;
    }
  }
  return { ok: false, motivo: 'No se pudo insertar tras varios intentos, intenta de nuevo.' };
}

async function buscarEspacioLibre(
  raizId: string,
  maxNiveles: number
): Promise<{ padreId: string; lado: 'IZQUIERDA' | 'DERECHA' } | null> {
  let cola: { id: string; nivel: number }[] = [{ id: raizId, nivel: 0 }];

  while (cola.length > 0) {
    const { id, nivel } = cola.shift()!;
    if (nivel >= maxNiveles) continue;

    const hijos = await prisma.user.findMany({
      where: { padreRedId: id },
      select: { id: true, ladoEnPadre: true },
    });
    const izq = hijos.find((h) => h.ladoEnPadre === 'IZQUIERDA');
    const der = hijos.find((h) => h.ladoEnPadre === 'DERECHA');

    if (!izq) return { padreId: id, lado: 'IZQUIERDA' };
    cola.push({ id: izq.id, nivel: nivel + 1 });

    if (!der) return { padreId: id, lado: 'DERECHA' };
    cola.push({ id: der.id, nivel: nivel + 1 });
  }

  return null;
}

/** Marca una cuenta como inactiva (no renovó). Conserva su posición en el árbol. */
export async function marcarInactivoDb(usuarioId: string): Promise<void> {
  await prisma.user.update({
    where: { id: usuarioId },
    data: { status: 'INACTIVA', inactivoDesde: new Date() },
  });
}

/**
 * Trae la red de `raizId` aplanada por niveles, hasta `maxNiveles`,
 * para pintar la UI. `raizId` incluido en el resultado como nivel 0.
 */
export async function obtenerArbolPorNiveles(raizId: string, maxNiveles = 15) {
  const raiz = await prisma.user.findUnique({
    where: { id: raizId },
    select: { id: true, nombre: true, apellido: true, status: true },
  });
  if (!raiz) return null;

  const niveles: (NodoRed | null)[][] = [];
  let actualIds: string[] = [raizId];

  for (let n = 1; n <= maxNiveles; n++) {
    const hijos = await prisma.user.findMany({
      where: { padreRedId: { in: actualIds } },
      select: { id: true, nombre: true, apellido: true, status: true, ladoEnPadre: true, padreRedId: true },
    });

    // Reconstruye la fila en el orden correcto (izq/der por cada padre, en el orden de actualIds).
    const fila: (NodoRed | null)[] = [];
    const siguientesIds: string[] = [];
    for (const padreId of actualIds) {
      const izq = hijos.find((h) => h.padreRedId === padreId && h.ladoEnPadre === 'IZQUIERDA');
      const der = hijos.find((h) => h.padreRedId === padreId && h.ladoEnPadre === 'DERECHA');
      fila.push(izq ? { ...izq, ladoEnPadre: 'IZQUIERDA' } : null);
      fila.push(der ? { ...der, ladoEnPadre: 'DERECHA' } : null);
      if (izq) siguientesIds.push(izq.id);
      if (der) siguientesIds.push(der.id);
    }

    if (fila.every((x) => x === null)) break;
    niveles.push(fila);
    actualIds = siguientesIds;
    if (actualIds.length === 0) break;
  }

  return { raiz, niveles };
}

export async function contarTotalDb(raizId: string): Promise<{ total: number; activos: number }> {
  let total = 1;
  let activos = 0;

  const raiz = await prisma.user.findUnique({ where: { id: raizId }, select: { status: true } });
  if (raiz?.status === 'ACTIVA') activos++;

  let actualIds = [raizId];
  while (actualIds.length > 0) {
    const hijos = await prisma.user.findMany({
      where: { padreRedId: { in: actualIds } },
      select: { id: true, status: true },
    });
    if (hijos.length === 0) break;
    total += hijos.length;
    activos += hijos.filter((h) => h.status === 'ACTIVA').length;
    actualIds = hijos.map((h) => h.id);
  }

  return { total, activos };
}
