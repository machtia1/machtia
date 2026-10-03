-- Marca si una regalía de la Red Alterna es un pago de nivel 1
-- SIMULADO (no generado por una invitación real) — pedido del
-- cliente el 2 oct 2026: durante la Red Alterna, las personas en
-- posiciones restringidas sin ningún invitado propio también deben
-- poder sumar, simulando que tuvieron un primer invitado.
--
-- No afecta ninguna fila existente: todas las regalías ya
-- registradas son reales, así que el valor por defecto (false) es
-- correcto para ellas.

ALTER TABLE "RegaliaRedAlterna"
  ADD COLUMN "simulada" BOOLEAN NOT NULL DEFAULT false;
