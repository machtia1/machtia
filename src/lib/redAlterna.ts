import { Suscripcion } from '@prisma/client';
import { prisma } from './prisma';

// ============================================================
// Red Alterna — Campaña de Lanzamiento
// ------------------------------------------------------------
// ⚠️ ACTUALIZACIÓN 18 sept 2026 — el cliente corrigió la regla que
// se había confirmado el 13 sept: la Red Alterna SÍ es un árbol real
// de posiciones, exactamente con el mismo mecanismo que la Red
// General / Red de Usuarios, cambiando la constante de 2 ramas por
// 8 ramas por nivel, a 5 niveles de profundidad de comisión (el
// árbol en sí puede seguir creciendo más abajo, pero solo se paga
// hasta 5 niveles hacia arriba).
//
// Mecanismo de inserción (ver `insertarEnRedAlterna` más abajo,
// copia exacta del patrón de `insertarEnRedUsuarios` en
// src/lib/redUsuarios.ts, con 8 posiciones por nodo en vez de 2):
// cada usuario se inserta por BFS (izquierda a derecha, nivel por
// nivel) dentro del árbol de quien lo invitó realmente
// (`invitadoPorId`) — si alguien invita a más de 8 personas
// directas, la 9ª en adelante se acomoda automáticamente en el
// primer espacio libre más abajo dentro de su propia rama (el mismo
// "desborde" que ya existe en la Red de Usuarios). Esta parte del
// desborde fue una decisión razonable tomada por el desarrollador —
// no una confirmación textual del cliente — porque no hay otro
// mecanismo de acomodo definido; si el cliente pide algo distinto,
// hay que ajustar solo `insertarEnRedAlterna`.
//
// 1. Cada persona gana regalías de hasta 5 niveles hacia arriba en
//    SU POSICIÓN dentro de este árbol (padreAlternaId), no en la
//    cadena real de invitación — mientras la campaña esté activa.
//
// 2. La tabla que se aplica es la del NIVEL MÁS BAJO entre quien
//    gana y quien se suscribió — nadie gana más de lo que su propio
//    nivel de suscripción permite, aunque el invitado haya pagado
//    una suscripción más cara:
//
//      Ganador    Invitado    Tabla aplicada
//      ─────────────────────────────────────
//      Básica     cualquiera  Básica
//      Plus       Básica      Básica
//      Plus       Plus        Plus
//      Plus       Negocios    Plus   (tope, no sube a Negocios)
//      Negocios   Básica      Básica
//      Negocios   Plus        Plus
//      Negocios   Negocios    Negocios
//
// 3. La Red General NO contabiliza ganancias mientras la Red
//    Alterna esté activa. Vuelve a contar a partir del corte.
//
// 4. Fechas de la campaña — actualizadas el 15 sept 2026: inicio
//    miércoles 16 de septiembre 2026, 12:00 PM (mediodía, luego
//    movido a las 10:00 PM el mismo día) hora Centro de México
//    (UTC-6). Corte: 30 de octubre 2026, 10:00 PM misma zona.
//
// Ver prisma/backfill-red-alterna.mjs para la reubicación de los
// usuarios ya aprobados antes del 18 sept al nuevo árbol, y la
// regeneración de sus regalías con la nueva lógica.
// ============================================================

/** Fecha y hora de INICIO de la Red Alterna (zona horaria de México, UTC-6). */
const RED_ALTERNA_INICIO_ISO = process.env.RED_ALTERNA_INICIO_ISO ?? '2026-09-16T22:00:00-06:00';

/** Fecha y hora de CORTE de la Red Alterna (zona horaria de México, UTC-6). */
const RED_ALTERNA_FIN_ISO = process.env.RED_ALTERNA_FIN_ISO ?? '2026-10-30T22:00:00-06:00';

/** Cuántas posiciones (ramas) tiene cada nodo del árbol de la Red Alterna. */
const RAMAS_POR_NODO = 8;

/** Solo estas 3 tablas de comisión existen de verdad. */
type SuscripcionElegible = 'BASICA' | 'PLUS' | 'NEGOCIOS';

/**
 * Suscripciones que SÍ generan regalías. Socio Fundador y Asociado
 * (espacios restringidos de la Red General) participan con la misma
 * mecánica que Negocios — confirmado por el cliente el 15 sept 2026 —
 * pero se normalizan a la tabla NEGOCIOS antes de calcular el monto,
 * para que `tablaAplicada` siempre sea una de las 3 tablas reales.
 */
type SuscripcionAmplia = SuscripcionElegible | 'SOCIO_FUNDADOR' | 'ASOCIADO';

const RANGO: Record<SuscripcionElegible, number> = {
  BASICA: 0,
  PLUS: 1,
  NEGOCIOS: 2,
};

/** Monto en MXN por nivel (1 a 5), según la tabla que envió el cliente. */
const TABLAS: Record<SuscripcionElegible, Record<number, number>> = {
  BASICA: { 1: 10.0, 2: 5.0, 3: 5.0, 4: 5.0, 5: 2.5 },
  PLUS: { 1: 20.0, 2: 10.0, 3: 10.0, 4: 10.0, 5: 5.0 },
  NEGOCIOS: { 1: 40.0, 2: 20.0, 3: 20.0, 4: 20.0, 5: 10.0 },
};

function esElegible(s: Suscripcion | null | undefined): s is SuscripcionAmplia {
  return s === 'BASICA' || s === 'PLUS' || s === 'NEGOCIOS' || s === 'SOCIO_FUNDADOR' || s === 'ASOCIADO';
}

/** Socio Fundador y Asociado calculan exactamente como Negocios. */
function tablaEfectiva(s: SuscripcionAmplia): SuscripcionElegible {
  if (s === 'SOCIO_FUNDADOR' || s === 'ASOCIADO') return 'NEGOCIOS';
  return s;
}

/** Estado puntual de la Red Alterna: aún no empieza, activa en este momento, o ya cerró. */
export function estadoRedAlterna(fecha: Date = new Date()): 'pendiente' | 'activa' | 'cerrada' {
  const inicio = new Date(RED_ALTERNA_INICIO_ISO).getTime();
  const fin = new Date(RED_ALTERNA_FIN_ISO).getTime();
  const ahora = fecha.getTime();
  if (ahora < inicio) return 'pendiente';
  if (ahora >= fin) return 'cerrada';
  return 'activa';
}

/** ¿La campaña de la Red Alterna sigue activa en este momento? */
export function redAlternaActiva(fecha: Date = new Date()): boolean {
  const inicio = new Date(RED_ALTERNA_INICIO_ISO).getTime();
  const fin = new Date(RED_ALTERNA_FIN_ISO).getTime();
  return fecha.getTime() >= inicio && fecha.getTime() < fin;
}

// ============================================================
// Árbol de la Red Alterna (8 ramas por nodo) — mismo patrón que
// insertarEnRedUsuarios/buscarEspacioLibre en src/lib/redUsuarios.ts,
// cambiando "IZQUIERDA/DERECHA" (2 lados) por una posición 1..8.
// ============================================================

const MAX_INTENTOS_INSERCION = 5;

/**
 * Inserta `nuevoUsuarioId` dentro del árbol de la Red Alterna de
 * `raizId` (quien lo invitó), siguiendo la regla de llenado BFS
 * (posición 1 a 8, nivel por nivel). Segura ante inserciones
 * concurrentes gracias a la restricción única de la base de datos.
 */
export async function insertarEnRedAlterna(
  raizId: string,
  nuevoUsuarioId: string,
  maxNiveles = 30
): Promise<{ ok: boolean; motivo?: string }> {
  for (let intento = 0; intento < MAX_INTENTOS_INSERCION; intento++) {
    const destino = await buscarEspacioLibreAlterna(raizId, maxNiveles);
    if (!destino) {
      return { ok: false, motivo: 'El árbol de la Red Alterna alcanzó el máximo de niveles.' };
    }

    try {
      await prisma.user.update({
        where: { id: nuevoUsuarioId },
        data: { padreAlternaId: destino.padreId, posicionEnPadreAlterna: destino.posicion },
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
  return { ok: false, motivo: 'No se pudo insertar en la Red Alterna tras varios intentos, intenta de nuevo.' };
}

async function buscarEspacioLibreAlterna(
  raizId: string,
  maxNiveles: number
): Promise<{ padreId: string; posicion: number } | null> {
  let cola: { id: string; nivel: number }[] = [{ id: raizId, nivel: 0 }];

  while (cola.length > 0) {
    const { id, nivel } = cola.shift()!;
    if (nivel >= maxNiveles) continue;

    const hijos = await prisma.user.findMany({
      where: { padreAlternaId: id },
      select: { id: true, posicionEnPadreAlterna: true },
    });
    const ocupadas = new Set(hijos.map((h) => h.posicionEnPadreAlterna));

    for (let posicion = 1; posicion <= RAMAS_POR_NODO; posicion++) {
      if (!ocupadas.has(posicion)) {
        return { padreId: id, posicion };
      }
    }

    // Las 8 posiciones ya están ocupadas: sigue buscando en la
    // siguiente generación, en el mismo orden (posición 1 a 8).
    const hijosOrdenados = hijos
      .slice()
      .sort((a, b) => (a.posicionEnPadreAlterna ?? 0) - (b.posicionEnPadreAlterna ?? 0));
    for (const hijo of hijosOrdenados) {
      cola.push({ id: hijo.id, nivel: nivel + 1 });
    }
  }

  return null;
}

/**
 * Calcula y GUARDA las regalías de la Red Alterna generadas por la
 * activación de una suscripción de pago. Camina hasta 5 niveles
 * hacia arriba en el ÁRBOL de la Red Alterna (padreAlternaId) — ya
 * NO en la cadena real de invitación.
 *
 * Se debe llamar exactamente una vez, en el momento en que se
 * aprueba el comprobante de pago (después de insertar a la persona
 * en el árbol con `insertarEnRedAlterna`, ver /api/admin/aprobar).
 *
 * Es seguro llamarla más de una vez por error de red: no vuelve a
 * pagar si ya existen regalías registradas con este origenId.
 */
export async function registrarRegaliasRedAlterna(nuevoUsuarioId: string): Promise<void> {
  if (!redAlternaActiva()) {
    return; // La campaña ya cerró, la Red General retoma el conteo.
  }

  const yaRegistrado = await prisma.regaliaRedAlterna.findFirst({
    where: { origenId: nuevoUsuarioId },
  });
  if (yaRegistrado) {
    return; // Ya se pagaron las regalías por esta suscripción, no duplicar.
  }

  const nuevoUsuario = await prisma.user.findUnique({
    where: { id: nuevoUsuarioId },
    select: { id: true, suscripcion: true, padreAlternaId: true },
  });

  if (!nuevoUsuario || !esElegible(nuevoUsuario.suscripcion)) {
    return; // Sin suscripción elegible, no genera regalías.
  }

  const susOrigen = tablaEfectiva(nuevoUsuario.suscripcion);

  let ancestroId = nuevoUsuario.padreAlternaId;
  let nivel = 1;

  while (ancestroId && nivel <= 5) {
    const ancestro = await prisma.user.findUnique({
      where: { id: ancestroId },
      select: { id: true, suscripcion: true, padreAlternaId: true },
    });

    if (!ancestro) break;

    if (esElegible(ancestro.suscripcion)) {
      const susAncestro = tablaEfectiva(ancestro.suscripcion);
      const tablaAplicada = RANGO[susAncestro] <= RANGO[susOrigen] ? susAncestro : susOrigen;

      const monto = TABLAS[tablaAplicada][nivel];

      await prisma.regaliaRedAlterna.create({
        data: {
          beneficiarioId: ancestro.id,
          origenId: nuevoUsuario.id,
          nivel,
          monto,
          tablaAplicada,
        },
      });
    }

    ancestroId = ancestro.padreAlternaId;
    nivel += 1;
  }
}

/** Resumen de regalías ganadas por un usuario en la Red Alterna. */
export async function resumenRegaliasUsuario(usuarioId: string) {
  const regalias = await prisma.regaliaRedAlterna.findMany({
    where: { beneficiarioId: usuarioId },
    orderBy: { creadoEn: 'desc' },
    include: {
      origen: { select: { nombre: true, apellido: true, suscripcion: true } },
    },
  });

  const total = regalias.reduce((suma: number, r: { monto: unknown }) => suma + Number(r.monto), 0);

  const porNivel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of regalias as Array<{ nivel: number; monto: unknown }>) {
    porNivel[r.nivel] = (porNivel[r.nivel] ?? 0) + Number(r.monto);
  }

  return { total, porNivel, movimientos: regalias, activa: redAlternaActiva(), estado: estadoRedAlterna() };
}

/** Tabla de comisiones completa (para mostrar la explicación por nivel en la pantalla de Campaña de Lanzamiento). */
export const TABLA_COMISIONES = TABLAS;

/**
 * Cuenta cuánta gente real tiene un usuario en cada uno de los 5
 * niveles de SU ÁRBOL de la Red Alterna (hacia abajo, por posición
 * — no por cadena de invitación), para dibujar el árbol de la
 * pantalla de Campaña de Lanzamiento.
 */
export async function arbolRedAlterna(usuarioId: string) {
  const niveles: { nivel: number; personas: number }[] = [];
  let idsNivelActual = [usuarioId];

  for (let nivel = 1; nivel <= 5; nivel++) {
    const hijos = await prisma.user.findMany({
      where: { padreAlternaId: { in: idsNivelActual } },
      select: { id: true },
    });
    niveles.push({ nivel, personas: hijos.length });
    idsNivelActual = hijos.map((h) => h.id);
    if (idsNivelActual.length === 0) break;
  }

  // Rellena los niveles restantes en 0 si el árbol se acabó antes de nivel 5.
  while (niveles.length < 5) {
    niveles.push({ nivel: niveles.length + 1, personas: 0 });
  }

  return { niveles, estado: estadoRedAlterna() };
}

interface NodoAlterna {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
  posicionEnPadreAlterna: number | null;
}

/**
 * Árbol GRÁFICO (nodo por nodo, no solo el conteo por nivel) de la
 * Red Alterna — pedido por el cliente el 25 sept 2026 ("vista de
 * árbol gráfico para Campaña de Lanzamiento"), con el mismo patrón
 * visual que ya existe para la Red de Usuarios
 * (`obtenerArbolPorNiveles` en redUsuarios.ts), cambiando 2 posiciones
 * por fila por 8.
 */
export async function obtenerArbolAlternaPorNiveles(raizId: string, maxNiveles = 5) {
  const raiz = await prisma.user.findUnique({
    where: { id: raizId },
    select: { id: true, nombre: true, apellido: true, status: true },
  });
  if (!raiz) return null;

  const niveles: (NodoAlterna | null)[][] = [];
  let actualIds: string[] = [raizId];

  for (let n = 1; n <= maxNiveles; n++) {
    const hijos = await prisma.user.findMany({
      where: { padreAlternaId: { in: actualIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        status: true,
        padreAlternaId: true,
        posicionEnPadreAlterna: true,
      },
    });

    const fila: (NodoAlterna | null)[] = [];
    const siguientesIds: string[] = [];
    for (const padreId of actualIds) {
      for (let pos = 1; pos <= 8; pos++) {
        const hijo = hijos.find((h) => h.padreAlternaId === padreId && h.posicionEnPadreAlterna === pos);
        fila.push(hijo ?? null);
        if (hijo) siguientesIds.push(hijo.id);
      }
    }

    if (fila.every((x) => x === null)) break;
    niveles.push(fila);
    actualIds = siguientesIds;
    if (actualIds.length === 0) break;
  }

  return { raiz, niveles };
}
