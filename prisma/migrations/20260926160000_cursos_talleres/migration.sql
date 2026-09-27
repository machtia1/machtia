-- Cursos y Talleres — "Elemento 4" (pedido por el cliente el 26 sept
-- 2026): interfaz completa (buscador, banner, "sigue aprendiendo",
-- filtros, carruseles, calendario, instructores, rutas de
-- aprendizaje) + reproducción/avance/evaluación por lección.

CREATE TYPE "TipoCurso" AS ENUM ('CURSO', 'TALLER');
CREATE TYPE "NivelDificultad" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO');
CREATE TYPE "CategoriaCurso" AS ENUM ('NEGOCIOS', 'FINANZAS', 'MARKETING', 'SALUD', 'IDIOMAS', 'HABILIDADES_DIGITALES');
CREATE TYPE "TipoLeccion" AS ENUM ('VIDEO', 'LECTURA');

CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Instructor_nombre_idx" ON "Instructor"("nombre");

CREATE TABLE "RutaAprendizaje" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" "NivelDificultad" NOT NULL DEFAULT 'BASICO',
    "color" TEXT NOT NULL DEFAULT '#2E3192',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RutaAprendizaje_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Curso" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCurso" NOT NULL DEFAULT 'CURSO',
    "titulo" TEXT NOT NULL,
    "descripcionBreve" TEXT NOT NULL,
    "descripcionLarga" TEXT,
    "portadaUrl" TEXT,
    "categoria" "CategoriaCurso" NOT NULL,
    "nivel" "NivelDificultad" NOT NULL DEFAULT 'BASICO',
    "instructorId" TEXT,
    "rutaAprendizajeId" TEXT,
    "ordenEnRuta" INTEGER,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 0,
    "calificacionPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numCalificaciones" INTEGER NOT NULL DEFAULT 0,
    "esNuevo" BOOLEAN NOT NULL DEFAULT false,
    "esEspecial" BOOLEAN NOT NULL DEFAULT false,
    "esCorto" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Curso_tipo_activo_idx" ON "Curso"("tipo", "activo");
CREATE INDEX "Curso_categoria_idx" ON "Curso"("categoria");
CREATE INDEX "Curso_esNuevo_idx" ON "Curso"("esNuevo");
CREATE INDEX "Curso_esEspecial_idx" ON "Curso"("esEspecial");
CREATE INDEX "Curso_esCorto_idx" ON "Curso"("esCorto");

ALTER TABLE "Curso" ADD CONSTRAINT "Curso_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_rutaAprendizajeId_fkey" FOREIGN KEY ("rutaAprendizajeId") REFERENCES "RutaAprendizaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Leccion" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipoContenido" "TipoLeccion" NOT NULL,
    "contenidoUrl" TEXT,
    "contenidoTexto" TEXT,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Leccion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Leccion_cursoId_orden_key" ON "Leccion"("cursoId", "orden");
ALTER TABLE "Leccion" ADD CONSTRAINT "Leccion_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InscripcionCurso" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "progreso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "calificacionEvaluacion" INTEGER,
    "inscritoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaActividad" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscripcionCurso_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InscripcionCurso_usuarioId_cursoId_key" ON "InscripcionCurso"("usuarioId", "cursoId");
CREATE INDEX "InscripcionCurso_usuarioId_idx" ON "InscripcionCurso"("usuarioId");

ALTER TABLE "InscripcionCurso" ADD CONSTRAINT "InscripcionCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InscripcionCurso" ADD CONSTRAINT "InscripcionCurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LeccionCompletada" (
    "id" TEXT NOT NULL,
    "inscripcionId" TEXT NOT NULL,
    "leccionId" TEXT NOT NULL,
    "completadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeccionCompletada_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeccionCompletada_inscripcionId_leccionId_key" ON "LeccionCompletada"("inscripcionId", "leccionId");

ALTER TABLE "LeccionCompletada" ADD CONSTRAINT "LeccionCompletada_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "InscripcionCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeccionCompletada" ADD CONSTRAINT "LeccionCompletada_leccionId_fkey" FOREIGN KEY ("leccionId") REFERENCES "Leccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EventoCurso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "instructorNombre" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "linkAcceso" TEXT,
    "cursoId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoCurso_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventoCurso_fechaHora_idx" ON "EventoCurso"("fechaHora");
ALTER TABLE "EventoCurso" ADD CONSTRAINT "EventoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
