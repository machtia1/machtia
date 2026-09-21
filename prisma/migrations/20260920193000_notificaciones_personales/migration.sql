-- Notificaciones personales por usuario (invitado directo nuevo,
-- alguien se unió a su Red 2x15) — pedido del cliente 20 sept 2026.

CREATE TABLE "NotificacionUsuario" (
    "id" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacionUsuario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificacionUsuario_destinatarioId_creadoEn_idx" ON "NotificacionUsuario"("destinatarioId", "creadoEn");

ALTER TABLE "NotificacionUsuario"
  ADD CONSTRAINT "NotificacionUsuario_destinatarioId_fkey"
  FOREIGN KEY ("destinatarioId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
