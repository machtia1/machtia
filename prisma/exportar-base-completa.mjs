import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { armarCsv, contarFilasCsv } from './lib-respaldo.mjs';

const prisma = new PrismaClient();

// ============================================================
// Exportación completa de la base de datos a archivos CSV
// (9 nov 2026) — respaldo previo al vaciado del nivel 7 en adelante,
// pedido por el cliente como "descargar los datos como una hoja de
// texto", sin contratar un servicio extra.
//
// QUÉ HACE: lee TODAS las tablas del esquema (se detectan solas, así
// que si se agrega una tabla nueva también se exporta) y escribe un
// archivo CSV por tabla en prisma/respaldos/exportacion-<fecha>/.
// Al final vuelve a leer cada archivo, cuenta sus filas y las compara
// con las de la base; el archivo _RESUMEN.csv deja constancia.
//
// QUÉ NO HACE: no modifica ni borra NADA en la base — solo lee.
//
// Privacidad: no se exporta passwordHash (contraseñas cifradas) ni
// los tokens de confirmación. Los archivos contienen datos
// personales: guardarlos en un lugar seguro y no subirlos a git
// (prisma/respaldos/ ya está en .gitignore).
//
// USO: npm run db:exportar-todo
// ============================================================

const CAMPOS_EXCLUIDOS = new Set(['passwordHash', 'tokenConfirmacion']);

async function main() {
  const ahora = new Date();
  const sello = ahora.toISOString().replace(/[:.]/g, '-');
  const carpeta = path.join(process.cwd(), 'prisma', 'respaldos', `exportacion-${sello}`);
  fs.mkdirSync(carpeta, { recursive: true });

  console.log('== Exportación completa de la base de datos a CSV ==');
  console.log(`Carpeta de destino: ${carpeta}\n`);

  const modelos = Prisma.dmmf.datamodel.models;
  const resumen = [];
  let hayDiferencias = false;

  for (const modelo of modelos) {
    const delegado = prisma[modelo.name.charAt(0).toLowerCase() + modelo.name.slice(1)];
    if (!delegado) {
      console.log(`⚠️  ${modelo.name}: no se encontró en el cliente de Prisma, se omite.`);
      continue;
    }

    const columnas = modelo.fields
      .filter((f) => (f.kind === 'scalar' || f.kind === 'enum') && !CAMPOS_EXCLUIDOS.has(f.name))
      .map((f) => f.name);

    const enBase = await delegado.count();
    const filas = await delegado.findMany();
    const texto = armarCsv(columnas, filas);
    const archivo = path.join(carpeta, `${modelo.name}.csv`);
    fs.writeFileSync(archivo, texto, 'utf8');

    // Verificación: se relee el archivo y se cuentan sus filas.
    const enArchivo = contarFilasCsv(fs.readFileSync(archivo, 'utf8'));
    const ok = enBase === filas.length && filas.length === enArchivo;
    if (!ok) hayDiferencias = true;

    resumen.push({ tabla: modelo.name, filas_en_base: enBase, filas_en_archivo: enArchivo, coincide: ok ? 'SI' : 'NO' });
    console.log(`${ok ? '✅' : '❌'} ${modelo.name.padEnd(28)} base: ${String(enBase).padStart(6)}   archivo: ${String(enArchivo).padStart(6)}`);
  }

  fs.writeFileSync(
    path.join(carpeta, '_RESUMEN.csv'),
    armarCsv(['tabla', 'filas_en_base', 'filas_en_archivo', 'coincide'], resumen),
    'utf8'
  );
  fs.writeFileSync(
    path.join(carpeta, 'LEEME.txt'),
    [
      'Respaldo de la base de datos de Club Machtia en archivos CSV',
      `Generado: ${ahora.toISOString()}`,
      '',
      'Un archivo por tabla; ábralos con Excel o Google Sheets.',
      '_RESUMEN.csv compara cuántas filas tenía cada tabla en la base contra las del archivo.',
      'No incluye contraseñas cifradas ni tokens de confirmación.',
      'Contiene datos personales: guárdelo en un lugar seguro.',
      '',
    ].join('\n'),
    'utf8'
  );

  console.log('\n---- RESULTADO ----');
  if (hayDiferencias) {
    console.log('❌ Hay tablas cuyas filas NO coinciden. NO continúes con el vaciado: mándame esta salida completa.');
    process.exitCode = 1;
  } else {
    console.log(`✅ Todas las tablas coinciden (${resumen.length} tablas).`);
    console.log(`Archivos guardados en: ${carpeta}`);
    console.log('Siguiente paso: guarda esa carpeta en un lugar seguro y mándame esta salida.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
