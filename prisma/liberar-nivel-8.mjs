import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Libera el nivel 8 de la Red General — pedido por el cliente el 22
 * sept 2026 ("vamos a abrir el nivel 8... creo que aplicamos la
 * opción que usted me comentó para liberar el espacio 8 sin dañar
 * ningún dato").
 *
 * Qué hace: por cada espacio de nivel 8 (SlotRestringido.nivel = 8)
 * que TODAVÍA NADIE reclamó (User.reservado = true, la fila
 * "placeholder" que existe solo para tener la posición conectada
 * desde el día uno — ver prisma/backfill-red-general.mjs), se borra
 * esa fila placeholder y su SlotRestringido. Al desaparecer, esa
 * posición queda realmente vacía, y el registro normal (por link de
 * invitación personal, igual que el nivel 9 en adelante) puede
 * llenarla por sí solo — ya no hace falta que el Administrador
 * genere una invitación específica para el nivel 8.
 *
 * Qué NO toca (por seguridad, para no dañar ningún dato real):
 *   - El espacio de nivel 8 que YA tiene una persona real
 *     registrada (User.reservado = false) — se deja exactamente
 *     como está.
 *   - Cualquier espacio placeholder que, por alguna razón, ya tenga
 *     algo enganchado (alguien debajo en el árbol, alguien que la
 *     haya invitado, regalías, notificaciones, etc.) — se deja sin
 *     tocar y se reporta en la consola para revisión manual, en vez
 *     de arriesgarse a borrar datos reales.
 *
 * No cambia ninguna posición del nivel 1 al 7 — solo nivel 8.
 *
 * ⚠️ Acción irreversible sobre la estructura de la Red General — se
 * corre UNA sola vez.
 */
async function main() {
  console.log('== Liberar nivel 8 de la Red General (22 sept 2026) ==');

  const slots = await prisma.slotRestringido.findMany({
    where: { nivel: 8 },
    include: {
      usuario: {
        select: { id: true, reservado: true, nombre: true, apellido: true },
      },
    },
    orderBy: { posicion: 'asc' },
  });
  console.log(`Espacios de nivel 8 encontrados: ${slots.length}`);

  let liberados = 0;
  let yaReclamados = 0;
  let protegidos = 0;

  for (const slot of slots) {
    if (!slot.usuario) {
      console.log(`⚠️  Espacio nivel 8, posición ${slot.posicion}: sin fila conectada, se omite.`);
      continue;
    }

    if (!slot.usuario.reservado) {
      // Ya lo reclamó una persona real (ej. la que mencionó el
      // cliente) — se deja intacta, tal cual está.
      yaReclamados++;
      continue;
    }

    // Placeholder sin reclamar. Antes de borrarlo, confirma que no
    // tenga NADA enganchado — ni gente debajo en ningún árbol, ni
    // invitados con su link, ni regalías, ni notificaciones.
    const [hijosRed, hijosAlterna, invitados, regaliasGanadas, regaliasOrigen, notificaciones] =
      await Promise.all([
        prisma.user.count({ where: { padreRedId: slot.usuario.id } }),
        prisma.user.count({ where: { padreAlternaId: slot.usuario.id } }),
        prisma.user.count({ where: { invitadoPorId: slot.usuario.id } }),
        prisma.regaliaRedAlterna.count({ where: { beneficiarioId: slot.usuario.id } }),
        prisma.regaliaRedAlterna.count({ where: { origenId: slot.usuario.id } }),
        prisma.notificacionUsuario.count({ where: { destinatarioId: slot.usuario.id } }),
      ]);

    const tieneAlgoEnganchado =
      hijosRed > 0 || hijosAlterna > 0 || invitados > 0 || regaliasGanadas > 0 || regaliasOrigen > 0 || notificaciones > 0;

    if (tieneAlgoEnganchado) {
      protegidos++;
      console.log(
        `⚠️  Espacio nivel 8, posición ${slot.posicion}: tiene datos enganchados ` +
          `(hijosRed=${hijosRed}, hijosAlterna=${hijosAlterna}, invitados=${invitados}, ` +
          `regalías=${regaliasGanadas + regaliasOrigen}, notificaciones=${notificaciones}) — ` +
          `NO se borra, requiere revisión manual.`
      );
      continue;
    }

    await prisma.$transaction([
      prisma.slotRestringido.delete({ where: { id: slot.id } }),
      prisma.user.delete({ where: { id: slot.usuario.id } }),
    ]);
    liberados++;
  }

  console.log('---');
  console.log(`✅ Espacios de nivel 8 liberados (ya no bloqueados, listos para registro normal): ${liberados}`);
  console.log(`ℹ️  Espacios de nivel 8 que ya tenía una persona real registrada (sin tocar): ${yaReclamados}`);
  console.log(`⚠️  Espacios protegidos por tener algo enganchado (revisar manualmente): ${protegidos}`);
  console.log('🎉 Listo. El nivel 8 ya funciona igual que el nivel 9 en adelante: se llena solo por invitación normal.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
