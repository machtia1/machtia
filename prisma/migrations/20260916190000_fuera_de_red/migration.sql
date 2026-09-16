-- Marca si un usuario fue eliminado definitivamente de la Red de
-- Usuarios (acción "Eliminar definitivo + comprimir" del Admin).
-- Conserva la cuenta, solo deja de contar como participante activo.
ALTER TABLE "User" ADD COLUMN "fueraDeRed" BOOLEAN NOT NULL DEFAULT false;
