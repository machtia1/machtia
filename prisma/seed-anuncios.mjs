// ============================================================
// Club Machtia — Seed: anuncios iniciales
// ------------------------------------------------------------
// Antes de este cambio, los 3 anuncios que se veían en el
// Dashboard estaban escritos fijos en el código. Ahora salen de
// la base de datos (tabla Anuncio), editable desde Panel de
// Administrador → Anuncios. Este script los crea UNA VEZ para que
// el Dashboard no se quede vacío justo después de desplegar.
//
// Correr con: npm run db:seed-anuncios
// Es seguro correrlo más de una vez: si ya existe algún anuncio en
// la base, no hace nada.
// ============================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existentes = await prisma.anuncio.count();
  if (existentes > 0) {
    console.log(`Ya hay ${existentes} anuncio(s) en la base de datos. No se creó nada nuevo.`);
    return;
  }

  await prisma.anuncio.createMany({
    data: [
      { etiqueta: 'Lanzamiento', texto: 'La cuenta regresiva para la Campaña de Lanzamiento ya está activa.' },
      { etiqueta: 'Cursos', texto: 'El curso de Inglés A1 estará disponible próximamente.' },
      { etiqueta: 'Plataforma', texto: 'Ya puedes enlazar tus redes sociales desde tu perfil.' },
    ],
  });

  console.log('✅ 3 anuncios iniciales creados correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error creando los anuncios iniciales:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
