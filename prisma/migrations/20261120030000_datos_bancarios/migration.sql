-- CreateTable
CREATE TABLE "DatosBancarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "datosCifrados" TEXT NOT NULL,
    "tieneBanco" BOOLEAN NOT NULL DEFAULT false,
    "tieneWallet" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosBancarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosBancarios_usuarioId_key" ON "DatosBancarios"("usuarioId");

-- AddForeignKey
ALTER TABLE "DatosBancarios" ADD CONSTRAINT "DatosBancarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
