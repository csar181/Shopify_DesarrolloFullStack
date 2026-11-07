-- Borra todo lo que crearon las pruebas de pruebas/api: los propietarios con correo
-- @pruebas.shopcloud.pe, sus tiendas y todo lo de esas tiendas (clientes, pedidos, catálogo...).
-- No toca ninguna otra cuenta.
--
--   psql -h localhost -U postgres -d shopcloud_test -f pruebas/api/limpiar.sql

BEGIN;

CREATE TEMP TABLE tiendas_de_prueba AS
  SELECT t.id
  FROM tiendas t
  JOIN usuarios u ON u.id = t.propietario_id
  WHERE u.correo_electronico LIKE '%@pruebas.shopcloud.pe';

DELETE FROM transacciones     WHERE pedido_id   IN (SELECT id FROM pedidos  WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM elementos_pedido  WHERE pedido_id   IN (SELECT id FROM pedidos  WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM pedidos           WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM elementos_carrito WHERE carrito_id  IN (SELECT id FROM carritos WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM carritos          WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM datos_facturacion WHERE cliente_id  IN (SELECT id FROM clientes WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM direcciones       WHERE cliente_id  IN (SELECT id FROM clientes WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM clientes          WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM descuentos        WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM metodos_pago      WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM inventario        WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM imagenes_producto WHERE producto_id IN (SELECT id FROM productos WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM variantes         WHERE producto_id IN (SELECT id FROM productos WHERE tienda_id IN (SELECT id FROM tiendas_de_prueba));
DELETE FROM productos         WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM categorias        WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM suscripciones     WHERE tienda_id   IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM tiendas           WHERE id          IN (SELECT id FROM tiendas_de_prueba);
DELETE FROM usuarios          WHERE correo_electronico LIKE '%@pruebas.shopcloud.pe';

COMMIT;

SELECT 'Quedan ' || (SELECT count(*) FROM usuarios) || ' propietarios y ' || (SELECT count(*) FROM tiendas) || ' tiendas.' AS resultado;
