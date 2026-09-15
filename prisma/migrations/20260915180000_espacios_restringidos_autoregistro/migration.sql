-- AlterEnum
ALTER TYPE "Suscripcion" ADD VALUE 'ASOCIADO';

-- AlterTable: invitadorSlug ahora es opcional (un preregistro puede venir
-- de un espacio restringido en vez de la invitación de un usuario normal)
ALTER TABLE "Preregistro" ALTER COLUMN "invitadorSlug" DROP NOT NULL;

-- AlterTable: nueva referencia opcional al espacio restringido de origen
ALTER TABLE "Preregistro" ADD COLUMN "slotRestringidoId" TEXT;

-- AddForeignKey
ALTER TABLE "Preregistro" ADD CONSTRAINT "Preregistro_slotRestringidoId_fkey" FOREIGN KEY ("slotRestringidoId") REFERENCES "SlotRestringido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
