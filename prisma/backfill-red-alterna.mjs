import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const RAMAS_POR_NODO = 8;
const MAX_NIVELES = 30;

/**
 * Copia local de la inserción BFS del árbol de la Red Alterna (misma
 * lógica que `insertarEnRedAlterna`/`buscarEspacioLibreAlterna` en
 * src/lib/redAlterna.ts). No se puede importar ese archivo aquí
 * porque usa el alias de rutas "@/lib/prisma" de Next.js, que este
 * script plano de Node no resuelve.
 */
async function buscarEspacioLibreAlterna(raizId, maxNiveles = MAX_NIVELES) {
  let cola = [{ id: raizId, nivel: 0 }];

  while (cola.length > 0) {
    const { id, nivel } = cola.shift();
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

    const hijosOrdenados = hijos
      .slice()
      .sort((a, b) => (a.posicionEnPadreAlterna ?? 0) - (b.posicionEnPadreAlterna ?? 0));
    for (const hijo of hijosOrdenados) {
      cola.push({ id: hijo.id, nivel: nivel + 1 });
    }
  }

  return null;
}

async function insertarEnRedAlterna(raizId, nuevoUsuarioId) {
  for (let intento = 0; intento < 5; intento++) {
    const destino = await buscarEspacioLibreAlterna(raizId);
    if (!destino) return { ok: false, motivo: 'Árbol lleno' };
    try {
      await prisma.user.update({
        where: { id: nuevoUsuarioId },
        data: { padreAlternaId: destino.padreId, posicionEnPadreAlterna: destino.posicion },
      });
      return { ok: true };
    } catch (error) {
      if (error?.code === 'P2002' && intento < 4) continue;
      throw error;
    }
  }
  return { ok: false, motivo: 'No se pudo insertar tras varios intentos' };
}

// ---- Copia local del cálculo de regalías (camina padreAlternaId) ----

const RANGO = { BASICA: 0, PLUS: 1, NEGOCIOS: 2 };
const TABLAS = {
  BASICA: { 1: 10.0, 2: 5.0, 3: 5.0, 4: 5.0, 5: 2.5 },
  PLUS: { 1: 20.0, 2: 10.0, 3: 10.0, 4: 10.0, 5: 5.0 },
  NEGOCIOS: { 1: 40.0, 2: 20.0, 3: 20.0, 4: 20.0, 5: 10.0 },
};

function esElegible(s) {
  return s === 'BASICA' || s === 'PLUS' || s === 'NEGOCIOS' || s === 'SOCIO_FUNDADOR' || s === 'ASOCIADO';
}

function tablaEfectiva(s) {
  if (s === 'SOCIO_FUNDADOR' || s === 'ASOCIADO') return 'NEGOCIOS';
  return s;
}

async function registrarRegaliasRedAlterna(nuevoUsuarioId) {
  const nuevoUsuario = await prisma.user.findUnique({
    where: { id: nuevoUsuarioId },
    select: { id: true, suscripcion: true, padreAlternaId: true },
  });
  if (!nuevoUsuario || !esElegible(nuevoUsuario.suscripcion)) return;

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

// ---- Backfill ----

async function main() {
  console.log('== Backfill Red Alterna: árbol de 8 ramas (18 sept 2026) ==');

  // Usuarios ya aprobados antes de este cambio, que fueron invitados
  // por alguien (los espacios restringidos sin invitador quedan
  // fuera, igual que antes). Se ordenan por fecha real de aprobación
  // — membresiaExpiraEn se fija a exactamente "fecha de aprobación +
  // 365 días" en /api/admin/aprobar, así que ordenar por ahí
  // reconstruye el orden real en el que se fueron aprobando.
  const usuarios = await prisma.user.findMany({
    where: {
      status: 'ACTIVA',
      invitadoPorId: { not: null },
      reservado: false,
    },
    select: { id: true, nombre: true, apellido: true, invitadoPorId: true, membresiaExpiraEn: true },
    orderBy: { membresiaExpiraEn: 'asc' },
  });

  console.log(`Usuarios activos a reubicar en el nuevo árbol: ${usuarios.length}`);

  if (usuarios.length === 0) {
    console.log('Nada que hacer — no hay usuarios activos invitados todavía.');
    return;
  }

  // Borra las regalías generadas con la lógica vieja (cadena de
  // invitación) de estos usuarios, para regenerarlas desde cero con
  // el árbol nuevo, en el mismo orden en que se aprobaron.
  const idsOrigen = usuarios.map((u) => u.id);
  const borradas = await prisma.regaliaRedAlterna.deleteMany({
    where: { origenId: { in: idsOrigen } },
  });
  console.log(`Regalías anteriores borradas (se regeneran con el árbol nuevo): ${borradas.count}`);

  let insertados = 0;
  for (const u of usuarios) {
    const resultado = await insertarEnRedAlterna(u.invitadoPorId, u.id);
    if (!resultado.ok) {
      console.error(`  ⚠️  No se pudo insertar a ${u.nombre} ${u.apellido} (${u.id}): ${resultado.motivo}`);
      continue;
    }
    await registrarRegaliasRedAlterna(u.id);
    insertados++;
  }

  console.log(`✅ Reubicados en el árbol de la Red Alterna y regalías regeneradas: ${insertados}`);
  console.log('🎉 Backfill de Red Alterna terminado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
