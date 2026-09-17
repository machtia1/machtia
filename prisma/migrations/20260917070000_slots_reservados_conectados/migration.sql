-- Marca si un usuario es un espacio "reservado" de la Red General
-- (niveles 1-8) todavía sin reclamar por nadie. Ver el comentario
-- junto al campo en schema.prisma y prisma/backfill-red-general.mjs
-- (script que hay que correr UNA VEZ después de esta migración).
ALTER TABLE "User" ADD COLUMN "reservado" BOOLEAN NOT NULL DEFAULT false;
