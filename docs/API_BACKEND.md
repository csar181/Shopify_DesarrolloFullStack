# API del backend de ShopCloud

Guía para conectar un cliente con la API. El detalle de cada DTO está en Swagger, con el backend en marcha: `http://localhost:8080/swagger-ui.html`.

## Autenticación y tienda actual

Hay dos tipos de cuenta con tokens JWT distintos. Se envían en `Authorization: Bearer <token>`.

| | Propietario | Cliente |
|---|---|---|
| **Registro** | `POST /api/auth/registro` | `POST /api/publico/tiendas/{slug}/clientes/registro` |
| **Inicio de sesión** | `POST /api/auth/login` | `POST /api/publico/tiendas/{slug}/clientes/login` |
| **Alcance** | Todas sus tiendas | Una sola tienda |
| **Tienda actual** | Cabecera `X-Tenant-ID`, obligatoria en sus rutas | Sale del token. Si se envía `X-Tenant-ID`, debe coincidir |

Un token de un tipo no sirve en las rutas del otro (403). El mismo correo puede tener cuentas independientes en cada tienda.

## Situación de una tienda

`GET /api/tiendas/{id}` y `GET /api/tiendas/mis-tiendas` devuelven `administrable`, `publicada`, `suscripcionTipo`, `planNombre` y `suscripcionFin`.

| Situación | Consultar panel | Configurar | Contratar | Público y compras |
|---|---|---|---|---|
| Prueba vigente | Sí | Sí, con los límites del plan | Sí | No |
| Prueba vencida | Sí | No | Sí | No |
| Plan pagado vigente | Sí | Sí | Sí | Sí |
| Plan vencido o cancelado | Sí | No | Sí | No |
| Desactivada por el propietario | Sí | No (reactivar antes) | No | No |

En cualquiera de estas situaciones:

- El propietario consulta y gestiona sus pedidos en `/api/gestion/pedidos`.
- El cliente inicia sesión y consulta `/api/pedidos`, `/api/pagos/transacciones` y los `GET` de `/api/mi-cuenta`.

Una suscripción está vigente mientras la fecha actual sea anterior a `fechaFin`. Las fechas se expresan en la hora de Lima.

## Errores

Las respuestas de error usan `application/problem+json`, con `status`, `title`, `detail` y, cuando aplica, `codigo` o `errores` (validación por campo).

| Código | HTTP | Significado |
|---|---|---|
| `TIENDA_NO_DISPONIBLE` | 404 en rutas públicas, 403 en rutas de cliente | La tienda no existe o no está publicada |
| `SUSCRIPCION_REQUERIDA` | 403 | Modo de solo lectura: hay que contratar un plan |
| `TIENDA_DESACTIVADA` | 403 | El propietario debe reactivarla |
| `LIMITE_PLAN` | 409 | Se alcanzó un límite de productos, categorías o imágenes |
| `FUNCIONALIDAD_NO_INCLUIDA` | 403 | Estas estadísticas no están en el plan |

Otros estados: 400 datos inválidos, 401 sin sesión o credenciales incorrectas, 403 sin permiso, 404 no existe o es de otra tienda, 409 regla de negocio.

## Rutas públicas

| Método y ruta | Uso |
|---|---|
| `GET /api/planes`, `GET /api/planes/{id}` | Planes activos, con límites y funcionalidades |
| `GET /api/publico/tiendas/{slug}` | Datos de la tienda |
| `GET /api/publico/tiendas/{slug}/categorias` | Categorías activas |
| `GET /api/publico/tiendas/{slug}/productos?categoriaId=` | Catálogo con imágenes, variantes y stock |
| `GET /api/publico/tiendas/{slug}/productos/{id}` | Detalle de un producto |

## Rutas del propietario

Todas exigen `X-Tenant-ID`, salvo `/api/tiendas` y `/api/usuarios`.

| Área | Rutas |
|---|---|
| **Cuenta** | `GET /api/auth/me`, `GET` y `PUT /api/usuarios/perfil` |
| **Tiendas** | `POST /api/tiendas` (requiere `planId` e inicia la prueba de 7 días), `GET /api/tiendas/mis-tiendas`, `GET`, `PUT` y `DELETE /api/tiendas/{id}`, `PATCH /api/tiendas/{id}/activar` |
| **Suscripción** | `POST /api/suscripciones/contratar` (pago simulado o renovación), `PUT /api/suscripciones/cambiar-plan` (solo en prueba), `GET /api/suscripciones` (historial), `GET` y `DELETE /api/suscripciones/activa` |
| **Categorías** | `POST` y `GET /api/categorias`, `GET`, `PUT` y `DELETE /api/categorias/{id}`, `PATCH /api/categorias/{id}/activar` |
| **Productos** | `POST` y `GET /api/productos`, `GET`, `PUT` y `DELETE /api/productos/{id}`, `PATCH /api/productos/{id}/activar` |
| **Variantes** | `POST` y `GET /api/productos/{id}/variantes`, `GET`, `PUT` y `DELETE /api/productos/{id}/variantes/{varianteId}` |
| **Imágenes** | `POST` y `GET /api/productos/{id}/imagenes`, `PUT` y `DELETE /api/productos/{id}/imagenes/{imagenId}` |
| **Inventario** | `POST` y `GET /api/inventario`, `GET /api/inventario/stock-bajo`, `GET`, `PUT` y `DELETE /api/inventario/{id}` (borrar exige stock cero) |
| **Descuentos** | `POST` y `GET /api/descuentos`, `GET /api/descuentos/vigentes`, `GET`, `PUT` y `DELETE /api/descuentos/{id}`, `PATCH /api/descuentos/{id}/activar` |
| **Clientes** | `GET /api/clientes`, `GET /api/clientes/{id}`, `GET /api/clientes/{id}/direcciones` |
| **Pedidos** | `GET /api/gestion/pedidos?estado=`, `GET /api/gestion/pedidos/{id}`, `PATCH /api/gestion/pedidos/{id}/estado` |
| **Métodos de pago** | `POST` y `GET /api/gestion/metodos-pago`, `GET`, `PUT` y `DELETE /api/gestion/metodos-pago/{id}`, `PATCH /api/gestion/metodos-pago/{id}/activar` |
| **Transacciones** | `GET /api/gestion/transacciones`, `GET /api/gestion/transacciones/{id}` |
| **Estadísticas** | `GET /api/analitica/dashboard` (básicas), `/ventas` (intermedias), `/productos-mas-vendidos` (avanzadas). Admiten `desde` y `hasta` |

Estados de un pedido:

```text
CONFIRMADO -> PREPARANDO -> ENVIADO -> ENTREGADO
CONFIRMADO o PREPARANDO -> CANCELADO
```

Cancelar anula la transacción y el comprobante y devuelve el stock, sin borrar nada.

## Rutas del cliente

| Área | Rutas |
|---|---|
| **Perfil** | `GET` y `PUT /api/mi-cuenta/perfil` |
| **Direcciones** | `GET` y `POST /api/mi-cuenta/direcciones`, `PUT` y `DELETE /api/mi-cuenta/direcciones/{id}` |
| **Facturación** | `GET` y `POST /api/mi-cuenta/datos-facturacion`, `PUT` y `DELETE /api/mi-cuenta/datos-facturacion/{id}` |
| **Carrito** | `GET` y `DELETE /api/carrito`, `POST /api/carrito/productos`, `PUT` y `DELETE /api/carrito/productos/{elementoId}`, `POST /api/carrito/sincronizar` |
| **Compra** | `GET /api/checkout/resumen?codigoDescuento=`, `POST /api/checkout` |
| **Pagos** | `GET /api/pagos/metodos`, `GET /api/pagos/transacciones`, `GET /api/pagos/transacciones/{id}` |
| **Pedidos** | `GET /api/pedidos`, `GET /api/pedidos/{id}` |

`POST /api/carrito/sincronizar` incorpora el carrito guardado en el navegador al iniciar sesión. Se puede repetir sin duplicar cantidades, ajusta al stock e informa en `advertencias` lo que omitió.

### Compra: `POST /api/checkout`

```json
{
  "direccionId": 1,
  "metodoPagoId": 1,
  "codigoDescuento": "VERANO",
  "tipoComprobante": "BOLETA",
  "numeroDocumento": "12345678",
  "nombreRazonSocial": "Ana Pérez",
  "guardarDatosFacturacion": true
}
```

- **Boleta (por defecto):** DNI de 8 dígitos y nombre completo.
- **Factura:** RUC de 11 dígitos y razón social; `direccionFiscal` es opcional.
- **Datos ya guardados:** se envía `datosFacturacionId` en lugar del documento y el nombre.
- **Importes:** salen del carrito y del catálogo. Lo que envíe el cliente se ignora.

La respuesta (201) incluye el pedido, el desglose (`subtotal`, `montoDescuento`, `baseImponible`, `montoIgv`, `total`), el `comprobante` simulado y la `transaccion`. Toda la operación es atómica: si algo falla, no queda ningún cambio.

## Límites de los planes

| | Emprendedor | Crecimiento | Profesional |
|---|---:|---:|---:|
| Precio mensual | S/ 29 | S/ 59 | S/ 99 |
| Productos activos | 30 | 100 | 500 |
| Categorías activas | 5 | 15 | 50 |
| Imágenes por producto | 3 | 5 | 8 |
| Miembros (`max_usuarios`, aún sin validar) | 1 | 3 | 10 |
| Estadísticas | Básicas | Intermedias | Avanzadas |

Los valores se leen de la tabla `planes`, así que se pueden modificar sin tocar el código.

## Ejecutar y probar

Requiere JDK 22 (`pom.xml`), PostgreSQL 17 y las variables de `backend/.env.example`.

```powershell
./database/aplicar.ps1             # primera vez
./database/aplicar.ps1 -Schema it  # primera vez, para las pruebas
cd backend
./mvnw spring-boot:run
./mvnw test                        # usa shopcloud_test, esquema it
```
