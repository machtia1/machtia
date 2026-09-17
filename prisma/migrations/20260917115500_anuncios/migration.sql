-- CreateTable
CREATE TABLE "Anuncio" (
    "id" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anuncio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Anuncio_activo_creadoEn_idx" ON "Anuncio"("activo", "creadoEn");
