import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Corrige el bug reportado por el cliente el 25 sept 2026: el
 * formulario de preregistro pedía "Nombre y Apellido" completo, y
 * luego el paso 2 volvía a pedir el apellido por separado — el
 * resultado quedaba guardado como, por ejemplo,
 * nombre="María López", apellido="López", y se mostraba en todos
 * lados como "María López López".
 *
 * El código ya se corrigió para que esto no le pase a nadie nuevo
 * (ver src/components/InvitacionLanding.tsx). Este script revisa a
 * los usuarios que YA quedaron mal guardados por el bug.
 *
 * Solo corrige el caso exacto y seguro: cuando el campo `nombre`
 * termina EXACTAMENTE con el `apellido` (sin importar mayúsculas),
 * ej. nombre="María López", apellido="López" → nombre pasa a "María".
 * Cualquier caso que no calce exacto (nombres compuestos, apellidos
 * compuestos, coincidencias parciales) se reporta en la consola para
 * revisar a mano, en vez de arriesgarse a recortar mal el nombre de
 * alguien.
 *
 * ⚠️ Modifica datos reales de usuarios — se corre UNA sola vez.
 */
function normaliza(s) {
  return s.trim().toLowerCase();
}

async function main() {
  console.log('== Corregir apellidos duplicados (25 sept 2026) ==');

  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, apellido: true },
  });
  console.log(`Usuarios revisados: ${usuarios.length}`);

  let corregidos = 0;
  let paraRevisar = 0;

  for (const u of usuarios) {
    const nombreNorm = normaliza(u.nombre);
    const apellidoNorm = normaliza(u.apellido);
    if (!apellidoNorm) continue;

    const sufijoExacto = ` ${apellidoNorm}`;
    if (nombreNorm === apellidoNorm) {
      // nombre === apellido a secas (ej. nombre="López", apellido="López") — caso raro, se reporta.
      console.log(`⚠️  ${u.nombre} ${u.apellido} (id ${u.id}): nombre y apellido son idénticos — revisar a mano.`);
      paraRevisar++;
      continue;
    }

    if (nombreNorm.endsWith(sufijoExacto)) {
      const nombreCorregido = u.nombre.slice(0, u.nombre.length - (sufijoExacto.length)).trim();
      if (!nombreCorregido) {
        console.log(`⚠️  ${u.nombre} ${u.apellido} (id ${u.id}): al quitar el apellido no queda nombre — revisar a mano.`);
        paraRevisar++;
        continue;
      }
      await prisma.user.update({
        where: { id: u.id },
        data: { nombre: nombreCorregido },
      });
      console.log(`✅ "${u.nombre} ${u.apellido}" → "${nombreCorregido} ${u.apellido}"`);
      corregidos++;
    }
  }

  console.log('---');
  console.log(`✅ Usuarios corregidos automáticamente: ${corregidos}`);
  console.log(`⚠️  Usuarios que necesitan revisión manual: ${paraRevisar}`);
  console.log('🎉 Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
