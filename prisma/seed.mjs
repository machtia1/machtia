// ============================================================
// Club Machtia — Seed: crea el primer usuario Administrador
// ------------------------------------------------------------
// Correr una sola vez con: npm run db:seed
// Puedes correrlo de nuevo sin problema: si el correo ya existe,
// no hace nada (no duplica ni sobrescribe).
// ============================================================
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@machtiaeducacion.com';
  const plainPassword = 'CambiaEstaClave123!';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const existing = await prisma.user.findUnique({ where: { correo: email } });
  if (existing) {
    console.log('Ya existe un usuario con ese correo:', email);
    console.log('No se creó nada nuevo.');
    return;
  }

  await prisma.user.create({
    data: {
      nombre: 'Admin',
      apellido: 'Machtia',
      correo: email,
      passwordHash,
      rol: 'ADMINISTRADOR',
      status: 'ACTIVA',
      correoConfirmado: true,
    },
  });

  console.log('✅ Usuario Administrador creado correctamente:');
  console.log('   Correo:      ', email);
  console.log('   Contraseña:  ', plainPassword);
  console.log('   (Cámbiala después de tu primer login real)');
}

main()
  .catch((e) => {
    console.error('❌ Error al crear el usuario Admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
