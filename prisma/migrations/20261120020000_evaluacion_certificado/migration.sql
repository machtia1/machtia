-- CreateTable
CREATE TABLE "ResultadoModulo" (
    "id" TEXT NOT NULL,
    "inscripcionId" TEXT NOT NULL,
    "leccionId" TEXT NOT NULL,
    "mejorNota" INTEGER NOT NULL,
    "ultimaNota" INTEGER NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultadoModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "inscripcionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "nombreAlumno" TEXT NOT NULL,
    "tituloCurso" TEXT NOT NULL,
    "instructor" TEXT,
    "horas" DOUBLE PRECISION,
    "calificacion" INTEGER NOT NULL,
    "calificacionMaxima" INTEGER NOT NULL DEFAULT 100,
    "emitidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoModulo_inscripcionId_leccionId_key" ON "ResultadoModulo"("inscripcionId", "leccionId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_folio_key" ON "Certificado"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_inscripcionId_key" ON "Certificado"("inscripcionId");

-- CreateIndex
CREATE INDEX "Certificado_usuarioId_idx" ON "Certificado"("usuarioId");

-- AddForeignKey
ALTER TABLE "ResultadoModulo" ADD CONSTRAINT "ResultadoModulo_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "InscripcionCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoModulo" ADD CONSTRAINT "ResultadoModulo_leccionId_fkey" FOREIGN KEY ("leccionId") REFERENCES "Leccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "InscripcionCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
