-- ============================================================
-- MIGRACIÓN 02: prueba gratuita de 7 días y pagos de suscripción
-- Se aplica sobre 01_shopcloud_postgresql.sql, sin modificarlo.
--
-- Cambios:
--   1. fecha_inicio y fecha_fin pasan de DATE a TIMESTAMP, porque la
--      prueba dura 7 días completos desde el momento de creación.
--   2. tipo: PRUEBA o PAGADA, independiente del estado.
--   3. monto_pagado y pagado_en: datos del pago simulado.
--   4. Una sola prueba por tienda en toda su historia.
--
-- Historial de pagos: cada pago crea su propia fila PAGADA y estos
-- valores no se sobrescriben al renovar.
--
-- Es segura si la tabla ya contiene registros: las filas existentes
-- se completan antes de exigir NOT NULL y las restricciones.
-- ============================================================

BEGIN;

ALTER TABLE suscripciones
    ALTER COLUMN fecha_inicio TYPE TIMESTAMP,
    ALTER COLUMN fecha_fin TYPE TIMESTAMP;

ALTER TABLE suscripciones
    ADD COLUMN tipo VARCHAR(20),
    ADD COLUMN monto_pagado NUMERIC(10,2),
    ADD COLUMN pagado_en TIMESTAMP;

-- Las filas anteriores a esta migración se tratan como periodos
-- pagados, al precio actual del plan. No afecta a tablas vacías.
UPDATE suscripciones AS s
SET tipo = 'PAGADA',
    monto_pagado = p.precio,
    pagado_en = s.creado_en,
    fecha_fin = COALESCE(
        s.fecha_fin,
        s.fecha_inicio + CASE p.periodicidad
            WHEN 'ANUAL' THEN INTERVAL '1 year'
            ELSE INTERVAL '1 month'
        END
    )
FROM planes AS p
WHERE p.id = s.plan_id;

ALTER TABLE suscripciones
    ALTER COLUMN tipo SET NOT NULL,
    ALTER COLUMN fecha_fin SET NOT NULL;

ALTER TABLE suscripciones
    ADD CONSTRAINT ck_suscripciones_tipo
        CHECK (tipo IN ('PRUEBA', 'PAGADA')),
    ADD CONSTRAINT ck_suscripciones_pago
        CHECK (
            (
                tipo = 'PRUEBA'
                AND monto_pagado IS NULL
                AND pagado_en IS NULL
            )
            OR (
                tipo = 'PAGADA'
                AND monto_pagado IS NOT NULL
                AND monto_pagado >= 0
                AND pagado_en IS NOT NULL
            )
        );

CREATE UNIQUE INDEX uq_suscripciones_tienda_prueba
    ON suscripciones(tienda_id)
    WHERE tipo = 'PRUEBA';

COMMIT;
