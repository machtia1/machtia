-- Permite que un usuario "borre" un aviso general del Administrador
-- desde su lista de notificaciones, sin borrar la fila real (la
-- siguen viendo los demás). Pedido por el cliente el 25 sept 2026.

CREATE TABLE "NotificacionOculta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "notificacionId" TEXT NOT NULL,
    "ocultaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacionOculta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificacionOculta_usuarioId_notificacionId_key" ON "NotificacionOculta"("usuarioId", "notificacionId");

ALTER TABLE "NotificacionOculta" ADD CONSTRAINT "NotificacionOculta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotificacionOculta" ADD CONSTRAINT "NotificacionOculta_notificacionId_fkey" FOREIGN KEY ("notificacionId") REFERENCES "Notificacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
