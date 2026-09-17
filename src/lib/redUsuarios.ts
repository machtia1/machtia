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
// 4. Compresión: SOLO la rama izquierda asciende, en cadena. Cada
//    nodo que sube "hereda" como su nuevo hijo derecho el que tenía
//    ORIGINALMENTE el nodo que reemplaza (los hijos derechos se van
//    heredando hacia abajo por la misma cadena). Regla y diagrama
//    confirmados por el cliente el 14 sept 2026 — verificada exacta
//    contra su ejemplo (P→B→C→E→I) antes de conectarla.
// 5. "Eliminar": aplica la compresión de la regla 4 y el usuario
//    queda fuera del árbol para siempre.
// 6. "Comprimir y enviar al fondo": aplica la misma compresión, y
//    el usuario se reinserta por BFS dentro de la red de quien lo
//    invitó originalmente (al fondo de la fila).
//
// Caso residual (no cubierto por el ejemplo del cliente, pero con
// una salida seguro que no pierde a nadie): si el último nodo de la
// cadena YA tenía su propio hijo derecho antes de recibir el
// heredado, ese hijo derecho se reinserta por BFS bajo su propio
// invitador original — nadie queda fuera del sistema.
// ============================================================

export interface NodoRed {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
  ladoEnPadre: 'IZQUIERDA' | 'DERECHA' | null;
  // true = espacio reservado de la Red General (niveles 1-8) que
  // todavía nadie ha reclamado. Ver el campo `reservado` en
  // schema.prisma y prisma/backfill-red-general.mjs.
  reservado: boolean;
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

/** true si `usuarioId` es un espacio reservado sin reclamar (no una persona real). */
async function esReservado(usuarioId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: usuarioId }, select: { reservado: true } });
  return u?.reservado ?? false;
}

/** Marca una cuenta como inactiva (no renovó). Conserva su posición en el árbol. */
export async function marcarInactivoDb(usuarioId: string): Promise<void> {
  if (await esReservado(usuarioId)) return;
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

  // Desde el 17 sept 2026, los 8 niveles restringidos de la Red
  // General ya son filas reales conectadas en la base de datos (ver
  // prisma/backfill-red-general.mjs) — un espacio sin reclamar
  // todavía trae reservado=true. Ya no hace falta simular nada aquí:
  // esta misma consulta trae, sin distinción, tanto los espacios
  // reservados como las personas reales, en su posición exacta.
  const niveles: (NodoRed | null)[][] = [];
  let actualIds: string[] = [raizId];

  for (let n = 1; n <= maxNiveles; n++) {
    const hijos = await prisma.user.findMany({
      where: { padreRedId: { in: actualIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        status: true,
        ladoEnPadre: true,
        padreRedId: true,
        reservado: true,
      },
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

  // Recorre TODA la red (incluye reservados) para poder seguir
  // bajando por el árbol, pero solo cuenta a las personas reales.
  let actualIds = [raizId];
  while (actualIds.length > 0) {
    const hijos = await prisma.user.findMany({
      where: { padreRedId: { in: actualIds } },
      select: { id: true, status: true, reservado: true },
    });
    if (hijos.length === 0) break;
    const reales = hijos.filter((h) => !h.reservado);
    total += reales.length;
    activos += reales.filter((h) => h.status === 'ACTIVA').length;
    actualIds = hijos.map((h) => h.id);
  }

  return { total, activos };
}

// ============================================================
// Compresión — "solo por la rama izquierda" (confirmada por el
// cliente con diagrama, 14 sept 2026)
// ============================================================

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Comprime la posición de `xId` tras sacarlo del árbol: la cadena de
 * hijos izquierdos asciende, y cada uno hereda como nuevo hijo
 * derecho el que tenía ORIGINALMENTE quien reemplaza. IMPORTANTE:
 * se debe llamar ANTES de borrar la posición de `xId` — esta función
 * necesita leer dónde estaba `xId` para saber a dónde mover la cadena.
 *
 * Devuelve el id de un "huérfano" a reinsertar por BFS, solo en el
 * caso residual (poco común) donde el último nodo de la cadena ya
 * tenía su propio hijo derecho antes de recibir el heredado — ver
 * nota al inicio del archivo.
 */
async function comprimirPosicion(tx: TxClient, xId: string): Promise<string | null> {
  const xPos = await tx.user.findUnique({
    where: { id: xId },
    select: { padreRedId: true, ladoEnPadre: true },
  });
  if (!xPos) return null;

  // 1. Construir la cadena de hijos izquierdos: [X, L1, L2, ..., Ln]
  const cadena: string[] = [xId];
  let actualId = xId;
  while (true) {
    const hijoIzq = await tx.user.findFirst({
      where: { padreRedId: actualId, ladoEnPadre: 'IZQUIERDA' },
      select: { id: true },
    });
    if (!hijoIzq) break;
    cadena.push(hijoIzq.id);
    actualId = hijoIzq.id;
  }

  // Caso base: X no tenía hijo izquierdo — su hijo derecho (si existe)
  // sube directo a ocupar la posición de X.
  if (cadena.length === 1) {
    const derechoX = await tx.user.findFirst({
      where: { padreRedId: xId, ladoEnPadre: 'DERECHA' },
      select: { id: true },
    });
    if (derechoX) {
      await tx.user.update({
        where: { id: derechoX.id },
        data: { padreRedId: xPos.padreRedId, ladoEnPadre: xPos.ladoEnPadre },
      });
    }
    return null;
  }

  // 2. Guardar los hijos derechos ORIGINALES de cada nodo de la cadena
  //    (excepto el último), antes de mover nada.
  const derechosOriginales: (string | null)[] = [];
  for (const id of cadena.slice(0, -1)) {
    const der = await tx.user.findFirst({
      where: { padreRedId: id, ladoEnPadre: 'DERECHA' },
      select: { id: true },
    });
    derechosOriginales.push(der?.id ?? null);
  }

  const ultimoId = cadena[cadena.length - 1];
  const derechoUltimoOriginal = await tx.user.findFirst({
    where: { padreRedId: ultimoId, ladoEnPadre: 'DERECHA' },
    select: { id: true },
  });

  // 3. L1 (cadena[1]) ocupa la posición original de X.
  await tx.user.update({
    where: { id: cadena[1] },
    data: { padreRedId: xPos.padreRedId, ladoEnPadre: xPos.ladoEnPadre },
  });

  // 4. Cada nodo de la cadena (desde L1) hereda como su nuevo hijo
  //    derecho el que tenía ORIGINALMENTE quien lo precede.
  for (let i = 1; i < cadena.length; i++) {
    const nuevoDerechoId = derechosOriginales[i - 1];
    if (nuevoDerechoId) {
      await tx.user.update({
        where: { id: nuevoDerechoId },
        data: { padreRedId: cadena[i], ladoEnPadre: 'DERECHA' },
      });
    }
  }

  // 5. Caso residual: el último de la cadena ya tenía su propio hijo
  //    derecho, desplazado por el heredado del paso anterior.
  return derechoUltimoOriginal?.id ?? null;
}

async function reinsertarHuerfanoSiHay(huerfanoId: string | null): Promise<void> {
  if (!huerfanoId) return;
  const huerfano = await prisma.user.findUnique({
    where: { id: huerfanoId },
    select: { invitadoPorId: true },
  });
  if (huerfano?.invitadoPorId) {
    await insertarEnRedUsuarios(huerfano.invitadoPorId, huerfanoId);
  }
}

/**
 * "Eliminar": saca a `usuarioId` del árbol para siempre. Comprime la
 * posición que deja (regla de la rama izquierda) y NO lo reinserta
 * en ningún lado.
 */
export async function eliminarDefinitivoDb(usuarioId: string): Promise<{ ok: boolean; motivo?: string }> {
  // Las posiciones de la Red General (niveles 1-8) son fijas por
  // diseño — comprimirlas rompería la conexión matemática entre
  // SlotRestringido.nivel/posicion y el árbol real. Esa zona se
  // administra solo desde el Panel de Administrador → Red General
  // ("Liberar este espacio"), nunca desde aquí.
  const slot = await prisma.slotRestringido.findUnique({ where: { usuarioId }, select: { id: true } });
  if (slot) {
    return {
      ok: false,
      motivo:
        'Esta posición pertenece a la Red General (niveles 1-8). Libérala desde el Panel de Administrador → Red General.',
    };
  }

  const huerfanoId = await prisma.$transaction(async (tx) => {
    const huerfano = await comprimirPosicion(tx, usuarioId);
    await tx.user.update({
      where: { id: usuarioId },
      data: { padreRedId: null, ladoEnPadre: null, fueraDeRed: true },
    });
    return huerfano;
  });

  await reinsertarHuerfanoSiHay(huerfanoId);
  return { ok: true };
}

/**
 * "Comprimir y enviar al fondo": comprime la posición de `usuarioId`
 * (misma regla) y lo reinserta por BFS al fondo de la red de quien
 * lo invitó originalmente.
 */
export async function enviarAlFondoDb(usuarioId: string): Promise<{ ok: boolean; motivo?: string }> {
  const usuario = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { invitadoPorId: true },
  });
  if (!usuario?.invitadoPorId) {
    return { ok: false, motivo: 'Esta persona no tiene un invitador original registrado.' };
  }

  const huerfanoId = await prisma.$transaction(async (tx) => {
    const huerfano = await comprimirPosicion(tx, usuarioId);
    await tx.user.update({
      where: { id: usuarioId },
      data: { padreRedId: null, ladoEnPadre: null },
    });
    return huerfano;
  });

  await reinsertarHuerfanoSiHay(huerfanoId);
  return insertarEnRedUsuarios(usuario.invitadoPorId, usuarioId);
}
