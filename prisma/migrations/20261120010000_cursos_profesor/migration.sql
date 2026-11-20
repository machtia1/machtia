-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN "estudios" TEXT,
ADD COLUMN "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN "autorId" TEXT,
ADD COLUMN "temario" TEXT,
ADD COLUMN "horas" DOUBLE PRECISION,
ADD COLUMN "calificacionMinima" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN "calificacionMaxima" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "permiteArchivos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "borrador" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ocultoPorAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PreguntaModulo" (
    "id" TEXT NOT NULL,
    "leccionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "opciones" TEXT[],
    "correctas" INTEGER[],

    CONSTRAINT "PreguntaModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivoCurso" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_usuarioId_key" ON "Instructor"("usuarioId");
CREATE UNIQUE INDEX "PreguntaModulo_leccionId_orden_key" ON "PreguntaModulo"("leccionId", "orden");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PreguntaModulo" ADD CONSTRAINT "PreguntaModulo_leccionId_fkey" FOREIGN KEY ("leccionId") REFERENCES "Leccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchivoCurso" ADD CONSTRAINT "ArchivoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
