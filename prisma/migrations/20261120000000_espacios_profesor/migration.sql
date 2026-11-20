-- CreateTable
CREATE TABLE "EspacioProfesor" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "inviteLink" TEXT NOT NULL,
    "status" "EstadoSlot" NOT NULL DEFAULT 'INVITADO',
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EspacioProfesor_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Preregistro" ADD COLUMN "espacioProfesorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EspacioProfesor_numero_key" ON "EspacioProfesor"("numero");
CREATE UNIQUE INDEX "EspacioProfesor_inviteLink_key" ON "EspacioProfesor"("inviteLink");
CREATE UNIQUE INDEX "EspacioProfesor_usuarioId_key" ON "EspacioProfesor"("usuarioId");

-- AddForeignKey
ALTER TABLE "EspacioProfesor" ADD CONSTRAINT "EspacioProfesor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Preregistro" ADD CONSTRAINT "Preregistro_espacioProfesorId_fkey" FOREIGN KEY ("espacioProfesorId") REFERENCES "EspacioProfesor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
