# Base de datos de ShopCloud

| Archivo | Contenido |
|---|---|
| `01_shopcloud_postgresql.sql` | Esquema de referencia. No se modifica. |
| `02_suscripciones_prueba_gratuita.sql` | Prueba gratuita y pagos de suscripción. |
| `03_datos_iniciales_planes.sql` | Planes Emprendedor, Crecimiento y Profesional. Se puede repetir sin duplicar. |
| `aplicar.ps1` | Crea `shopcloud_test` si falta y aplica los tres scripts en orden. |

## Preparar la base

Requiere PostgreSQL 17 y la variable de entorno `DB_PASSWORD`.

```powershell
./database/aplicar.ps1             # aplicación: esquema public
./database/aplicar.ps1 -Schema it  # pruebas de integración: esquema it
```

El script se detiene sin cambiar nada si el esquema ya tiene tablas.

**Importante:** las pruebas de integración vacían el esquema `it` antes de cada caso, salvo la tabla `planes`. Comprueban primero que están en `shopcloud_test/it` y nunca tocan `public` ni otras bases.

## Por qué existe la migración 02

- `fecha_inicio` y `fecha_fin` pasan de `DATE` a `TIMESTAMP`. La prueba dura 7 días completos desde el momento de creación, y con `DATE` se perderían las horas del primer día.
- `tipo` (`PRUEBA` o `PAGADA`) indica qué es la suscripción, y `estado` indica su situación.
- `monto_pagado` y `pagado_en` guardan el pago simulado. Cada pago tiene su propia fila y estos valores no se sobrescriben.
- `uq_suscripciones_tienda_prueba` permite una sola prueba por tienda en toda su historia.

La migración es segura con datos: completa las filas existentes como `PAGADA`, al precio actual del plan, antes de exigir `NOT NULL`. Después de ejecutarla no se puede revertir automáticamente, así que haz una copia de seguridad si la aplicas sobre una base con datos reales.

## Cambiar la contraseña de PostgreSQL

La contraseña anterior está en el historial de git y debe considerarse comprometida.

1. Cámbiala desde psql. Así no queda escrita en el historial de la terminal:

   ```text
   psql -U postgres
   \password postgres
   ```

2. Actualiza los demás proyectos que usen el usuario `postgres` en este servidor.
3. Define `DB_PASSWORD` en "Variables de entorno" de Windows y reinicia VS Code o IntelliJ.
4. No reescribas el historial de git: la contraseña antigua deja de servir y el repositorio es compartido.
