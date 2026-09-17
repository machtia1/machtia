import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const MAX_NIVEL = 8;

/**
 * Copia local de la búsqueda BFS de espacio libre en el árbol
 * (misma lógica que `buscarEspacioLibre` en src/lib/redUsuarios.ts).
 * No se puede importar ese archivo aquí porque usa el alias de rutas
 * "@/lib/prisma" de Next.js, que este script plano de Node no resuelve.
 */
async function buscarEspacioLibre(raizId, maxNiveles = 15) {
  let cola = [{ id: raizId, nivel: 0 }];

  while (cola.length > 0) {
    const { id, nivel } = cola.shift();
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

/**
 * Si alguien ya está sentado en (padreId, lado) y NO es el dueño
 * legítimo de esa posición (`usuarioIdEsperado`), lo desconecta y lo
 * guarda para reinsertarlo después con BFS normal. Devuelve sin hacer
 * nada si el espacio está libre o si ya lo ocupa el dueño correcto.
 */
async function liberarEspacioSiHayIntruso(padreId, lado, usuarioIdEsperado, idsAReinsertar, etiqueta) {
  const ocupante = await prisma.user.findFirst({
    where: { padreRedId: padreId, ladoEnPadre: lado },
    select: { id: true, nombre: true, apellido: true },
  });
  if (!ocupante) return;
  if (usuarioIdEsperado && ocupante.id === usuarioIdEsperado) return;

  console.log(
    `⚠️  ${etiqueta}: el espacio ya lo ocupaba ${ocupante.nombre} ${ocupante.apellido} (sin posición fija en la Red General). Se desconecta temporalmente para reubicarlo(a) después.`
  );
  await prisma.user.update({
    where: { id: ocupante.id },
    data: { padreRedId: null, ladoEnPadre: null },
  });
  idsAReinsertar.push(ocupante.id);
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { rol: 'ADMINISTRADOR' },
    orderBy: { creadoEn: 'asc' },
    select: { id: true, nombre: true, apellido: true },
  });
  if (!admin) {
    throw new Error('No se encontró ningún usuario con rol ADMINISTRADOR. Corre primero "npm run db:seed".');
  }
  console.log(`Raíz del árbol: ${admin.nombre} ${admin.apellido} (${admin.id})`);

  const idsAReinsertar = [];

  // -----------------------------------------------------------------
  // Conecta los 510 espacios de la Red General (niveles 1-8). Antes de
  // colocar a cada quien en su posición fija, revisa si alguien más
  // (registrado por el flujo normal de invitación, antes de que la Red
  // General compartiera árbol) ya está sentado ahí, y si es así lo
  // desconecta temporalmente para reubicarlo después.
  // -----------------------------------------------------------------
  const mapaIds = new Map();
  let creados = 0;
  let reconectados = 0;

  for (let nivel = 1; nivel <= MAX_NIVEL; nivel++) {
    const totalEnNivel = 2 ** nivel;
    for (let posicion = 1; posicion <= totalEnNivel; posicion++) {
      const parentNivel = nivel - 1;
      const parentPos = Math.ceil(posicion / 2);
      const lado = posicion % 2 === 1 ? 'IZQUIERDA' : 'DERECHA';
      const parentId = nivel === 1 ? admin.id : mapaIds.get(`${parentNivel}-${parentPos}`);
      if (!parentId) {
        throw new Error(`No se encontró el padre para nivel ${nivel}, posición ${posicion}.`);
      }

      const slot = await prisma.slotRestringido.findUnique({
        where: { nivel_posicion: { nivel, posicion } },
        select: { id: true, usuarioId: true },
      });
      if (!slot) {
        throw new Error(`No existe SlotRestringido para nivel ${nivel}, posición ${posicion}.`);
      }

      await liberarEspacioSiHayIntruso(
        parentId,
        lado,
        slot.usuarioId,
        idsAReinsertar,
        `Nivel ${nivel}, Espacio ${posicion}`
      );

      if (slot.usuarioId) {
        await prisma.user.update({
          where: { id: slot.usuarioId },
          data: { padreRedId: parentId, ladoEnPadre: lado },
        });
        mapaIds.set(`${nivel}-${posicion}`, slot.usuarioId);
        reconectados++;
        // Por si este mismo usuario había quedado marcado como
        // "intruso" a desconectar en un paso anterior del propio
        // recorrido (poco probable, pero por seguridad): ya tiene
        // hogar fijo aquí, no hace falta reinsertarlo después.
        const idx = idsAReinsertar.indexOf(slot.usuarioId);
        if (idx !== -1) idsAReinsertar.splice(idx, 1);
        continue;
      }

      const placeholder = await prisma.user.create({
        data: {
          nombre: 'Espacio',
          apellido: `Reservado (Nivel ${nivel})`,
          correo: `reservado-${randomUUID()}@interno.clubmachtia`,
          correoConfirmado: false,
          reservado: true,
          padreRedId: parentId,
          ladoEnPadre: lado,
        },
        select: { id: true },
      });
      await prisma.slotRestringido.update({
        where: { id: slot.id },
        data: { usuarioId: placeholder.id },
      });
      mapaIds.set(`${nivel}-${posicion}`, placeholder.id);
      creados++;
    }
  }
  console.log(
    `✅ Red General conectada. Espacios reservados creados: ${creados}. Espacios reconectados (ya tenían usuario): ${reconectados}.`
  );

  // -----------------------------------------------------------------
  // Reinserta, con búsqueda BFS normal, a cualquier persona real que se
  // haya tenido que desconectar en el proceso. Cae naturalmente en el
  // primer espacio libre a partir del nivel 9. Su propia red hacia
  // abajo se mueve sola, porque sus hijos apuntan a su `id`, no a una
  // posición.
  // -----------------------------------------------------------------
  if (idsAReinsertar.length > 0) {
    console.log(`Reinsertando ${idsAReinsertar.length} usuario(s) reubicado(s)...`);
    for (const id of idsAReinsertar) {
      const espacio = await buscarEspacioLibre(admin.id, 15);
      if (!espacio) {
        throw new Error(`No se encontró espacio libre en el árbol para reinsertar al usuario ${id}.`);
      }
      await prisma.user.update({
        where: { id },
        data: { padreRedId: espacio.padreId, ladoEnPadre: espacio.lado },
      });
      const u = await prisma.user.findUnique({ where: { id }, select: { nombre: true, apellido: true } });
      console.log(`   → ${u?.nombre} ${u?.apellido} reubicado(a) bajo ${espacio.padreId} (lado: ${espacio.lado})`);
    }
    console.log('✅ Reubicación completa.');
  }

  console.log('🎉 Backfill de Red General terminado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el backfill de Red General:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
