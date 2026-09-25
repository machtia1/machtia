-- Nueva sección "Publicidad": carrusel de hasta 8 imágenes en
-- formato Facebook, descargables por cualquier usuario. Pedido por
-- el cliente el 25 sept 2026.

CREATE TABLE "PublicidadImagen" (
    "id" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicidadImagen_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicidadImagen_activo_orden_idx" ON "PublicidadImagen"("activo", "orden");
