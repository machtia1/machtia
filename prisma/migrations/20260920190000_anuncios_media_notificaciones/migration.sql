-- Anuncios con imagen/video + Notificaciones directas (pedido del
-- cliente 20 sept 2026).

CREATE TYPE "MediaTipo" AS ENUM ('IMAGEN', 'VIDEO');

ALTER TABLE "Anuncio" ADD COLUMN "mediaUrl" TEXT;
ALTER TABLE "Anuncio" ADD COLUMN "mediaTipo" "MediaTipo";

ALTER TABLE "User" ADD COLUMN "ultimaNotificacionVistaEn" TIMESTAMP(3);

CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notificacion_creadoEn_idx" ON "Notificacion"("creadoEn");
