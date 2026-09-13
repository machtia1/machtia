-- CreateTable
CREATE TABLE "RegaliaRedAlterna" (
    "id" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "origenId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "tablaAplicada" "Suscripcion" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegaliaRedAlterna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegaliaRedAlterna_beneficiarioId_idx" ON "RegaliaRedAlterna"("beneficiarioId");

-- CreateIndex
CREATE INDEX "RegaliaRedAlterna_origenId_idx" ON "RegaliaRedAlterna"("origenId");

-- AddForeignKey
ALTER TABLE "RegaliaRedAlterna" ADD CONSTRAINT "RegaliaRedAlterna_beneficiarioId_fkey" FOREIGN KEY ("beneficiarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegaliaRedAlterna" ADD CONSTRAINT "RegaliaRedAlterna_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
