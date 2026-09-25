// Corrige a mano los 2 casos que el script automático
// (corregir-apellidos-duplicados.mjs, 25 sept 2026) dejó pendientes
// por ambigüedad: nombre y apellido idénticos ("Sara Elizabeth
// Constantino Silván" en ambos campos, en 2 cuentas distintas).
//
// Siguiendo el mismo patrón que el resto de la base de datos
// (2 nombres + 2 apellidos), se separa como:
//   nombre = "Sara Elizabeth"
//   apellido = "Constantino Silván"
//
// Por seguridad, cada caso se verifica ANTES de tocarlo: solo se
// corrige si nombre y apellido siguen siendo EXACTAMENTE el texto
// esperado. Si algo ya cambió, se reporta y no se toca.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEXTO_ORIGINAL = 'Sara Elizabeth Constantino Silván';
const NOMBRE_CORREGIDO = 'Sara Elizabeth';
const APELLIDO_CORREGIDO = 'Constantino Silván';

const CASOS = [
  { id: 'cmu4g46z3000350eio2dvp8zg' },
  { id: 'cmu5457ch0003cwjt6f96oocu' },
];

async function main() {
  console.log('== Corregir casos especiales de apellidos duplicados (25 sept 2026) ==');

  for (const caso of CASOS) {
    const usuario = await prisma.user.findUnique({
      where: { id: caso.id },
      select: { id: true, nombre: true, apellido: true, correo: true },
    });

    if (!usuario) {
      console.log(`⚠️  No se encontró el usuario con id ${caso.id} — se omite.`);
      continue;
    }

    if (usuario.nombre !== TEXTO_ORIGINAL || usuario.apellido !== TEXTO_ORIGINAL) {
      console.log(
        `⚠️  El usuario ${caso.id} (${usuario.correo}) ya no tiene el texto esperado ` +
          `(nombre="${usuario.nombre}", apellido="${usuario.apellido}") — se omite por seguridad.`
      );
      continue;
    }

    await prisma.user.update({
      where: { id: caso.id },
      data: { nombre: NOMBRE_CORREGIDO, apellido: APELLIDO_CORREGIDO },
    });
    console.log(`✅ ${usuario.correo}: "${TEXTO_ORIGINAL} ${TEXTO_ORIGINAL}" → "${NOMBRE_CORREGIDO} ${APELLIDO_CORREGIDO}"`);
  }

  console.log('🎉 Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
