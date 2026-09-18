-- Red Alterna pasa de "cadena de invitación sin límite" a árbol real
-- de 8 posiciones por nivel (confirmado por el cliente el 18 sept 2026).

ALTER TABLE "User" ADD COLUMN "padreAlternaId" TEXT;
ALTER TABLE "User" ADD COLUMN "posicionEnPadreAlterna" INTEGER;

CREATE INDEX "User_padreAlternaId_idx" ON "User"("padreAlternaId");

CREATE UNIQUE INDEX "User_padreAlternaId_posicionEnPadreAlterna_key"
  ON "User"("padreAlternaId", "posicionEnPadreAlterna");

ALTER TABLE "User"
  ADD CONSTRAINT "User_padreAlternaId_fkey"
  FOREIGN KEY ("padreAlternaId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
