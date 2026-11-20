import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cuentas restringidas: desde el 19 nov 2026 solo existen 3 tipos (Socio
 * Fundador, Asociado y Administrativo/Operativo). Cualquier espacio
 * restringido que estuviera registrado como Profesor/Facilitador pasa
 * automáticamente a Asociado.
 *
 * Solo toca usuarios que ocupan un espacio restringido (SlotRestringido).
 * Los profesores nuevos (con su propio espacio de Profesor) NO se tocan.
 *
 * Uso:
 *   node prisma/convertir-profesores-restringidos-a-asociado.mjs          (solo muestra qué haría)
 *   node prisma/convertir-profesores-restringidos-a-asociado.mjs --aplicar (aplica el cambio)
 */
const aplicar = process.argv.includes('--aplicar');

async function main() {
  console.log(`== Profesores en espacios restringidos → Asociado (${aplicar ? 'APLICAR' : 'solo vista previa'}) ==`);

  const candidatos = await prisma.user.findMany({
    where: {
      rol: 'PROFESOR_FACILITADOR',
      slotRestringido: { isNot: null },
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      correo: true,
      slotRestringido: { select: { nivel: true, posicion: true } },
    },
  });

  console.log(`Encontrados: ${candidatos.length}`);
  for (const u of candidatos) {
    const s = u.slotRestringido;
    console.log(` - ${u.nombre} ${u.apellido} <${u.correo}> (nivel ${s?.nivel}, espacio ${s?.posicion})`);
  }

  if (!aplicar) {
    console.log('\nNo se cambió nada. Agrega --aplicar para convertirlos.');
    return;
  }

  const r = await prisma.user.updateMany({
    where: { id: { in: candidatos.map((u) => u.id) } },
    data: { rol: 'USUARIO', suscripcion: 'ASOCIADO' },
  });
  console.log(`\nConvertidos a Asociado: ${r.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
