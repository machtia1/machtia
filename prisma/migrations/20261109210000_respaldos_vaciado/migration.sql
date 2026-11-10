-- CreateTable
CREATE TABLE "RespaldoUsuarioBorrado" (
    "id" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "usuarioIdOriginal" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "pais" TEXT,
    "rol" TEXT NOT NULL,
    "suscripcion" TEXT,
    "status" TEXT NOT NULL,
    "membresiaExpiraEn" TIMESTAMP(3),
    "comprobantePagoUrl" TEXT,
    "invitadoPorCorreo" TEXT,
    "padreRedCorreo" TEXT,
    "nivelRestringido" INTEGER,
    "creadoEnOriginal" TIMESTAMP(3) NOT NULL,
    "totalGanado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalGenerado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "respaldadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespaldoUsuarioBorrado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespaldoRegaliaRedAlterna" (
    "id" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "regaliaIdOriginal" TEXT NOT NULL,
    "beneficiarioIdOriginal" TEXT NOT NULL,
    "beneficiarioNombre" TEXT NOT NULL,
    "beneficiarioCorreo" TEXT NOT NULL,
    "origenIdOriginal" TEXT NOT NULL,
    "origenNombre" TEXT NOT NULL,
    "origenCorreo" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "tablaAplicada" TEXT NOT NULL,
    "simulada" BOOLEAN NOT NULL DEFAULT false,
    "creadoEnOriginal" TIMESTAMP(3) NOT NULL,
    "respaldadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespaldoRegaliaRedAlterna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RespaldoUsuarioBorrado_lote_idx" ON "RespaldoUsuarioBorrado"("lote");

-- CreateIndex
CREATE INDEX "RespaldoUsuarioBorrado_correo_idx" ON "RespaldoUsuarioBorrado"("correo");

-- CreateIndex
CREATE INDEX "RespaldoRegaliaRedAlterna_lote_idx" ON "RespaldoRegaliaRedAlterna"("lote");

-- CreateIndex
CREATE INDEX "RespaldoRegaliaRedAlterna_beneficiarioCorreo_idx" ON "RespaldoRegaliaRedAlterna"("beneficiarioCorreo");
