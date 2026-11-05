-- ============================================================
-- DATOS INICIALES: planes de la plataforma
-- Se puede ejecutar varias veces: no duplica ni sobrescribe planes,
-- así que los cambios hechos después en estas filas se conservan.
--
-- funcionalidades.estadisticas: BASICAS | INTERMEDIAS | AVANZADAS
-- max_usuarios queda preparado para la futura gestión de empleados.
-- Todavía no se valida; al implementarla habrá que definir si el
-- propietario cuenta dentro del límite.
-- ============================================================

BEGIN;

INSERT INTO planes (
    nombre, descripcion, precio, periodicidad, max_productos,
    max_usuarios, max_categorias, max_imagenes_producto, funcionalidades
)
VALUES
    ('Emprendedor', 'Para empezar a vender en línea',
     29.00, 'MENSUAL', 30, 1, 5, 3, '{"estadisticas": "BASICAS"}'),
    ('Crecimiento', 'Para tiendas en expansión',
     59.00, 'MENSUAL', 100, 3, 15, 5, '{"estadisticas": "INTERMEDIAS"}'),
    ('Profesional', 'Para catálogos grandes',
     99.00, 'MENSUAL', 500, 10, 50, 8, '{"estadisticas": "AVANZADAS"}')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
