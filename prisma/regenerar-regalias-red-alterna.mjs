import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Regenera las regalías de la Red Alterna que se perdieron con el
// reset del 20 de septiembre 2026 (ver prisma/reset-ganancias-red-
// alterna.mjs) — pedido explícitamente por el cliente el 2 de
// octubre: "Por favor. Solo para los que como tal hayan realizado
// invitados directos".
//
// Qué hace: recorre a TODOS los usuarios reales (no reservados) que
// ya están ACTIVA, en el orden en que se aprobaron, y para cada uno
// que todavía NO tiene ninguna regalía registrada como origen,
// calcula sus regalías normal (igual que `registrarRegaliasRedAlterna`
// en src/lib/redAlterna.ts: camina hasta 5 niveles hacia arriba por
// su posición real en el árbol — padreAlternaId — y paga a cada
// ancestro elegible según la tabla correspondiente).
//
// Por qué es seguro:
//   - Es ESTRICTAMENTE aditivo: solo crea las regalías que faltan,
//     nunca borra ni modifica una que ya exista.
//   - Si un usuario YA tiene al menos una regalía como origen (por
//     ejemplo, los 2 casos de después del reset, del 25 y 30 de
//     sept), se omite por completo — así nunca se duplica nada.
//   - No inventa ningún pago para quien no tiene invitados reales:
//     si alguien no tiene padreAlternaId (nunca fue insertado en el
//     árbol porque nadie lo invitó, o él mismo es un espacio
//     restringido sin invitados), simplemente no genera nada que
//     pagar hacia arriba — tal como pidió el cliente.
//   - No toca ninguna posición del árbol (padreAlternaId), solo
//     agrega filas en RegaliaRedAlterna.
// ============================================================

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

/** Copia exacta de la lógica real de src/lib/redAlterna.ts, sin el filtro de fecha (recalculo retroactivo). */
async function regenerarParaOrigen(nuevoUsuario) {
  if (!esElegible(nuevoUsuario.suscripcion)) return 0;

  const susOrigen = tablaEfectiva(nuevoUsuario.suscripcion);
  let ancestroId = nuevoUsuario.padreAlternaId;
  let nivel = 1;
  let creadas = 0;

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
      creadas++;
    }

    ancestroId = ancestro.padreAlternaId;
    nivel += 1;
  }

  return creadas;
}

async function main() {
  console.log('== Regeneración de regalías Red Alterna perdidas por el reset del 20 sept 2026 ==\n');

  const usuarios = await prisma.user.findMany({
    where: { status: 'ACTIVA', reservado: false },
    select: { id: true, nombre: true, apellido: true, suscripcion: true, padreAlternaId: true },
    orderBy: { creadoEn: 'asc' },
  });

  console.log(`Usuarios activos a revisar: ${usuarios.length}`);

  let omitidosYaTenianRegalia = 0;
  let omitidosSinArbol = 0;
  let procesados = 0;
  let regaliasCreadas = 0;

  for (const u of usuarios) {
    const yaRegistrado = await prisma.regaliaRedAlterna.findFirst({ where: { origenId: u.id } });
    if (yaRegistrado) {
      omitidosYaTenianRegalia++;
      continue;
    }

    if (!u.padreAlternaId) {
      // No tiene ancestro en el árbol de la Red Alterna (nadie lo
      // invitó, o él mismo es raíz sin invitados abajo pagándole a
      // él) — no hay nada que generar hacia arriba para este caso.
      omitidosSinArbol++;
      continue;
    }

    const creadas = await regenerarParaOrigen(u);
    if (creadas > 0) {
      console.log(`  ✅ ${u.nombre} ${u.apellido}: ${creadas} regalía(s) regenerada(s) hacia su(s) ancestro(s).`);
      regaliasCreadas += creadas;
    }
    procesados++;
  }

  console.log('\n---- RESUMEN ----');
  console.log(`Usuarios que ya tenían regalía registrada (sin tocar): ${omitidosYaTenianRegalia}`);
  console.log(`Usuarios sin posición en el árbol de la Red Alterna (sin nada que generar): ${omitidosSinArbol}`);
  console.log(`Usuarios procesados para regenerar: ${procesados}`);
  console.log(`Total de regalías nuevas creadas: ${regaliasCreadas}`);
  console.log('\n🎉 Regeneración terminada. No se duplicó ni se borró ninguna regalía existente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
