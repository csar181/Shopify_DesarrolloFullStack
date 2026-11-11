# ShopCloud: todas las APIs en Postman

Colección: `docs/ShopCloud_Todas_las_APIs.postman_collection.json` (Importar → archivo).

- Ejecuta las peticiones **en orden**: cada una guarda en variables los IDs que usan las siguientes.
- Requisitos: backend en `http://localhost:8080` y base de datos con los 3 planes cargados.
- Cada ejecución crea un propietario nuevo (`jesus<marca de tiempo>@pruebas.shopcloud.pe`) y una tienda nueva. Para borrarlos: `psql -h localhost -U postgres -d shopcloud_test -f pruebas/api/limpiar.sql`.
- Las rutas de propietario dentro de una tienda llevan `X-Tenant-ID: {{tiendaId}}`. Las de cliente no lo necesitan: la tienda va dentro del token.

## Variables

| Variable | Se guarda en |
|---|---|
| `baseUrl` | Valor fijo: `http://localhost:8080` |
| `tokenPropietario` | 1.3 Registrar propietario |
| `correoPropietario` | 1.3 Registrar propietario |
| `planId` | 1.1 Listar planes (público) |
| `planProfesionalId` | 1.1 Listar planes (público) |
| `tiendaId` | 2.1 Crear tienda (inicia 7 días de prueba) |
| `slug` | 2.1 Crear tienda (inicia 7 días de prueba) |
| `categoriaId` | 3.1 Crear categoría Polos |
| `categoriaTemporalId` | 3.2 Crear categoría Temporal |
| `productoId` | 4.1 Crear producto Polo (S/ 59) |
| `varianteId` | 4.7 Crear variante Talla M |
| `imagenId` | 4.11 Agregar imagen |
| `productoGorraId` | 5.2 Crear producto Gorra (S/ 35) |
| `inventarioId` | 5.1 Registrar 10 unidades del Polo |
| `inventarioGorraId` | 5.3 Registrar Gorra sin stock |
| `descuentoId` | 6.1 Crear descuento 10% |
| `metodoPagoId` | 7.1 Crear método Yape |
| `tokenCliente` | 9.1 Registrar cliente en la tienda |
| `clienteId` | 9.1 Registrar cliente en la tienda |
| `direccionId` | 9.5 Agregar dirección principal |
| `direccionSecundariaId` | 9.6 Agregar dirección secundaria |
| `datosFacturacionId` | 9.10 Guardar datos para boleta (DNI) |
| `datosFacturacionRucId` | 9.11 Guardar datos para factura (RUC) |
| `elementoId` | 10.2 Agregar 1 polo al carrito |
| `pedidoId` | 10.11 Comprar con boleta y descuento |
| `transaccionId` | 10.14 Ver mis pagos |

## 1. Planes y cuenta del propietario

### 1.1 Listar planes (público)

`GET {{baseUrl}}/api/planes`

- **Autorización:** Sin token
- **Nota:** Guarda planId (Emprendedor) y planProfesionalId.

### 1.2 Ver un plan

`GET {{baseUrl}}/api/planes/{{planId}}`

- **Autorización:** Sin token

### 1.3 Registrar propietario

`POST {{baseUrl}}/api/auth/registro`

- **Autorización:** Sin token
- **Nota:** Genera un correo único en cada ejecución y guarda tokenPropietario.

```json
{
  "nombre": "Jesus Ramirez",
  "correoElectronico": "{{correoPropietario}}",
  "contrasena": "clave12345"
}
```

### 1.4 Iniciar sesión (propietario)

`POST {{baseUrl}}/api/auth/login`

- **Autorización:** Sin token

```json
{
  "correoElectronico": "{{correoPropietario}}",
  "contrasena": "clave12345"
}
```

### 1.5 Ver usuario autenticado

`GET {{baseUrl}}/api/auth/me`

- **Autorización:** Bearer `{{tokenPropietario}}`

### 1.6 Ver mi perfil

`GET {{baseUrl}}/api/usuarios/perfil`

- **Autorización:** Bearer `{{tokenPropietario}}`

### 1.7 Actualizar mi perfil

`PUT {{baseUrl}}/api/usuarios/perfil`

- **Autorización:** Bearer `{{tokenPropietario}}`

```json
{
  "nombre": "Jesus Ramirez Torres",
  "correoElectronico": "{{correoPropietario}}"
}
```


## 2. Tienda en prueba gratuita

### 2.1 Crear tienda (inicia 7 días de prueba)

`POST {{baseUrl}}/api/tiendas`

- **Autorización:** Bearer `{{tokenPropietario}}`
- **Nota:** Guarda tiendaId y slug. Si el slug ya existe, el backend le agrega un sufijo.

```json
{
  "planId": {{planId}},
  "nombre": "Mi Tienda",
  "slug": "mi-tienda",
  "descripcion": "Ropa urbana hecha en Perú",
  "colorPrimario": "#1E40AF",
  "correoContacto": "contacto@mitienda.pe",
  "telefonoContacto": "999888777"
}
```

### 2.2 Listar mis tiendas

`GET {{baseUrl}}/api/tiendas/mis-tiendas`

- **Autorización:** Bearer `{{tokenPropietario}}`

### 2.3 Ver mi tienda

`GET {{baseUrl}}/api/tiendas/{{tiendaId}}`

- **Autorización:** Bearer `{{tokenPropietario}}`

### 2.4 Actualizar tienda

`PUT {{baseUrl}}/api/tiendas/{{tiendaId}}`

- **Autorización:** Bearer `{{tokenPropietario}}`

```json
{
  "nombre": "Mi Tienda Perú",
  "descripcion": "Ropa urbana y accesorios",
  "urlLogo": "https://picsum.photos/200",
  "urlBanner": "https://picsum.photos/1200/300",
  "colorPrimario": "#0F766E",
  "correoContacto": "ventas@mitienda.pe",
  "telefonoContacto": "999888777"
}
```

### 2.5 Ver suscripción activa (PRUEBA)

`GET {{baseUrl}}/api/suscripciones/activa`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 2.6 Cambiar a plan Profesional (solo en prueba)

`PUT {{baseUrl}}/api/suscripciones/cambiar-plan`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** El plan Profesional habilita las tres estadísticas de analítica.

```json
{
  "planId": {{planProfesionalId}}
}
```

### 2.7 El público NO ve la tienda en prueba

`GET {{baseUrl}}/api/publico/tiendas/{{slug}}`

- **Autorización:** Sin token
- **Nota:** Error esperado: la tienda aún no está publicada.


## 3. Catálogo: categorías

### 3.1 Crear categoría Polos

`POST {{baseUrl}}/api/categorias`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Polos",
  "descripcion": "Polos de algodón"
}
```

### 3.2 Crear categoría Temporal

`POST {{baseUrl}}/api/categorias`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Temporal",
  "descripcion": "Para probar desactivar y activar"
}
```

### 3.3 Listar categorías

`GET {{baseUrl}}/api/categorias?incluirInactivos=false`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 3.4 Ver categoría

`GET {{baseUrl}}/api/categorias/{{categoriaId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 3.5 Actualizar categoría

`PUT {{baseUrl}}/api/categorias/{{categoriaId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Polos",
  "descripcion": "Polos de algodón pima"
}
```

### 3.6 Desactivar categoría Temporal

`DELETE {{baseUrl}}/api/categorias/{{categoriaTemporalId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Borrado lógico: la categoría queda inactiva.

### 3.7 Reactivar categoría Temporal

`PATCH {{baseUrl}}/api/categorias/{{categoriaTemporalId}}/activar`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`


## 4. Catálogo: productos, variantes e imágenes

### 4.1 Crear producto Polo (S/ 59)

`POST {{baseUrl}}/api/productos`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "categoriaId": {{categoriaId}},
  "nombre": "Polo",
  "descripcion": "Polo básico",
  "sku": "POLO-001",
  "precio": 59.0,
  "destacado": true
}
```

### 4.2 Listar productos

`GET {{baseUrl}}/api/productos?incluirInactivos=false`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 4.3 Ver producto

`GET {{baseUrl}}/api/productos/{{productoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 4.4 Actualizar producto

`PUT {{baseUrl}}/api/productos/{{productoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "categoriaId": {{categoriaId}},
  "nombre": "Polo",
  "descripcion": "Polo básico de algodón",
  "sku": "POLO-001",
  "precio": 59.0,
  "destacado": true
}
```

### 4.5 Desactivar producto

`DELETE {{baseUrl}}/api/productos/{{productoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Borrado lógico.

### 4.6 Reactivar producto

`PATCH {{baseUrl}}/api/productos/{{productoId}}/activar`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 4.7 Crear variante Talla M

`POST {{baseUrl}}/api/productos/{{productoId}}/variantes`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Talla M",
  "sku": "POLO-001-M",
  "precio": 59.0
}
```

### 4.8 Listar variantes

`GET {{baseUrl}}/api/productos/{{productoId}}/variantes`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 4.9 Ver variante

`GET {{baseUrl}}/api/productos/{{productoId}}/variantes/{{varianteId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 4.10 Actualizar variante

`PUT {{baseUrl}}/api/productos/{{productoId}}/variantes/{{varianteId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Talla M",
  "sku": "POLO-001-M",
  "precio": 62.0
}
```

### 4.11 Agregar imagen

`POST {{baseUrl}}/api/productos/{{productoId}}/imagenes`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "urlImagen": "https://picsum.photos/600",
  "esPrincipal": true
}
```

### 4.12 Listar imágenes

`GET {{baseUrl}}/api/productos/{{productoId}}/imagenes`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 4.13 Actualizar imagen

`PUT {{baseUrl}}/api/productos/{{productoId}}/imagenes/{{imagenId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "urlImagen": "https://picsum.photos/700",
  "esPrincipal": true
}
```

### 4.14 Eliminar imagen

`DELETE {{baseUrl}}/api/productos/{{productoId}}/imagenes/{{imagenId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Borrado físico.


## 5. Inventario

### 5.1 Registrar 10 unidades del Polo

`POST {{baseUrl}}/api/inventario`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Un producto lleva stock general (sin varianteId) o stock por variante (con varianteId), nunca ambos.

```json
{
  "productoId": {{productoId}},
  "cantidad": 10,
  "cantidadMinima": 2
}
```

### 5.2 Crear producto Gorra (S/ 35)

`POST {{baseUrl}}/api/productos`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Segundo producto para mostrar el stock bajo y el borrado de inventario.

```json
{
  "categoriaId": {{categoriaId}},
  "nombre": "Gorra",
  "sku": "GORRA-001",
  "precio": 35.0
}
```

### 5.3 Registrar Gorra sin stock

`POST {{baseUrl}}/api/inventario`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Stock 0: aparece en stock bajo y luego se puede eliminar.

```json
{
  "productoId": {{productoGorraId}},
  "cantidad": 0,
  "cantidadMinima": 1
}
```

### 5.4 Listar inventario

`GET {{baseUrl}}/api/inventario`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 5.5 Ver productos con stock bajo

`GET {{baseUrl}}/api/inventario/stock-bajo`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 5.6 Ver registro de inventario

`GET {{baseUrl}}/api/inventario/{{inventarioId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 5.7 Actualizar stock del Polo a 20

`PUT {{baseUrl}}/api/inventario/{{inventarioId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "cantidad": 20,
  "cantidadMinima": 3
}
```

### 5.8 Eliminar inventario de la Gorra

`DELETE {{baseUrl}}/api/inventario/{{inventarioGorraId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Solo se puede eliminar un registro con stock 0.

### 5.9 Desactivar variante

`DELETE {{baseUrl}}/api/productos/{{productoId}}/variantes/{{varianteId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Borrado lógico.


## 6. Descuentos

### 6.1 Crear descuento 10%

`POST {{baseUrl}}/api/descuentos`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** tipo: PORCENTAJE o MONTO_FIJO.

```json
{
  "codigo": "BIENVENIDA10",
  "tipo": "PORCENTAJE",
  "valor": 10,
  "fechaInicio": "2026-01-01T00:00:00",
  "fechaFin": "2030-12-31T23:59:59"
}
```

### 6.2 Listar descuentos

`GET {{baseUrl}}/api/descuentos`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 6.3 Listar descuentos vigentes

`GET {{baseUrl}}/api/descuentos/vigentes`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 6.4 Ver descuento

`GET {{baseUrl}}/api/descuentos/{{descuentoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 6.5 Actualizar descuento

`PUT {{baseUrl}}/api/descuentos/{{descuentoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "codigo": "BIENVENIDA10",
  "tipo": "PORCENTAJE",
  "valor": 10,
  "fechaInicio": "2026-01-01T00:00:00",
  "fechaFin": "2030-12-31T23:59:59"
}
```

### 6.6 Desactivar descuento

`DELETE {{baseUrl}}/api/descuentos/{{descuentoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 6.7 Reactivar descuento

`PATCH {{baseUrl}}/api/descuentos/{{descuentoId}}/activar`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`


## 7. Métodos de pago de la tienda

### 7.1 Crear método Yape

`POST {{baseUrl}}/api/gestion/metodos-pago`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Yape",
  "tipo": "YAPE",
  "instrucciones": "Yapea al 999 888 777",
  "datosPago": "999888777"
}
```

### 7.2 Listar métodos de pago

`GET {{baseUrl}}/api/gestion/metodos-pago`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 7.3 Ver método de pago

`GET {{baseUrl}}/api/gestion/metodos-pago/{{metodoPagoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 7.4 Actualizar método de pago

`PUT {{baseUrl}}/api/gestion/metodos-pago/{{metodoPagoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "nombre": "Yape",
  "tipo": "YAPE",
  "instrucciones": "Yapea al 999 888 777 a nombre de Mi Tienda",
  "datosPago": "999888777"
}
```

### 7.5 Desactivar método de pago

`DELETE {{baseUrl}}/api/gestion/metodos-pago/{{metodoPagoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Borrado lógico.

### 7.6 Reactivar método de pago

`PATCH {{baseUrl}}/api/gestion/metodos-pago/{{metodoPagoId}}/activar`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`


## 8. Contratar plan y publicar la tienda

### 8.1 Contratar plan Profesional (pago simulado)

`POST {{baseUrl}}/api/suscripciones/contratar`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "planId": {{planProfesionalId}}
}
```

### 8.2 Historial de suscripciones

`GET {{baseUrl}}/api/suscripciones`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 8.3 Ver suscripción activa (PAGADA)

`GET {{baseUrl}}/api/suscripciones/activa`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 8.4 Ver tienda pública

`GET {{baseUrl}}/api/publico/tiendas/{{slug}}`

- **Autorización:** Sin token

### 8.5 Ver categorías públicas

`GET {{baseUrl}}/api/publico/tiendas/{{slug}}/categorias`

- **Autorización:** Sin token

### 8.6 Ver productos públicos por categoría

`GET {{baseUrl}}/api/publico/tiendas/{{slug}}/productos?categoriaId={{categoriaId}}`

- **Autorización:** Sin token

### 8.7 Ver detalle de producto público

`GET {{baseUrl}}/api/publico/tiendas/{{slug}}/productos/{{productoId}}`

- **Autorización:** Sin token


## 9. Cuenta del cliente

### 9.1 Registrar cliente en la tienda

`POST {{baseUrl}}/api/publico/tiendas/{{slug}}/clientes/registro`

- **Autorización:** Sin token

```json
{
  "nombre": "Ana Perez",
  "correoElectronico": "ana@prueba.pe",
  "contrasena": "clave12345",
  "telefono": "987654321"
}
```

### 9.2 Iniciar sesión (cliente)

`POST {{baseUrl}}/api/publico/tiendas/{{slug}}/clientes/login`

- **Autorización:** Sin token

```json
{
  "correoElectronico": "ana@prueba.pe",
  "contrasena": "clave12345"
}
```

### 9.3 Ver mi perfil

`GET {{baseUrl}}/api/mi-cuenta/perfil`

- **Autorización:** Bearer `{{tokenCliente}}`

### 9.4 Actualizar mi perfil

`PUT {{baseUrl}}/api/mi-cuenta/perfil`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "nombre": "Ana Perez Gomez",
  "telefono": "987654321"
}
```

### 9.5 Agregar dirección principal

`POST {{baseUrl}}/api/mi-cuenta/direcciones`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "lineaDireccion": "Av. Arequipa 123",
  "ciudad": "Lima",
  "distrito": "Lince",
  "departamento": "Lima",
  "codigoPostal": "15046",
  "referencia": "Frente al parque"
}
```

### 9.6 Agregar dirección secundaria

`POST {{baseUrl}}/api/mi-cuenta/direcciones`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "lineaDireccion": "Jr. Junín 456",
  "ciudad": "Lima",
  "distrito": "Cercado de Lima",
  "departamento": "Lima"
}
```

### 9.7 Listar mis direcciones

`GET {{baseUrl}}/api/mi-cuenta/direcciones`

- **Autorización:** Bearer `{{tokenCliente}}`

### 9.8 Actualizar dirección

`PUT {{baseUrl}}/api/mi-cuenta/direcciones/{{direccionId}}`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "lineaDireccion": "Av. Arequipa 123, Dpto 501",
  "ciudad": "Lima",
  "distrito": "Lince",
  "departamento": "Lima",
  "codigoPostal": "15046",
  "referencia": "Frente al parque"
}
```

### 9.9 Eliminar dirección secundaria

`DELETE {{baseUrl}}/api/mi-cuenta/direcciones/{{direccionSecundariaId}}`

- **Autorización:** Bearer `{{tokenCliente}}`

### 9.10 Guardar datos para boleta (DNI)

`POST {{baseUrl}}/api/mi-cuenta/datos-facturacion`

- **Autorización:** Bearer `{{tokenCliente}}`
- **Nota:** DNI: 8 dígitos. Se usará en el checkout.

```json
{
  "tipoDocumento": "DNI",
  "numeroDocumento": "12345678",
  "nombreRazonSocial": "Ana Perez Gomez"
}
```

### 9.11 Guardar datos para factura (RUC)

`POST {{baseUrl}}/api/mi-cuenta/datos-facturacion`

- **Autorización:** Bearer `{{tokenCliente}}`
- **Nota:** RUC: 11 dígitos.

```json
{
  "tipoDocumento": "RUC",
  "numeroDocumento": "20123456789",
  "nombreRazonSocial": "Ana Perez EIRL",
  "direccionFiscal": "Av. Arequipa 123, Lince"
}
```

### 9.12 Listar datos de facturación

`GET {{baseUrl}}/api/mi-cuenta/datos-facturacion`

- **Autorización:** Bearer `{{tokenCliente}}`

### 9.13 Actualizar datos RUC

`PUT {{baseUrl}}/api/mi-cuenta/datos-facturacion/{{datosFacturacionRucId}}`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "tipoDocumento": "RUC",
  "numeroDocumento": "20123456789",
  "nombreRazonSocial": "Ana Perez Gomez EIRL",
  "direccionFiscal": "Av. Arequipa 123, Lince"
}
```

### 9.14 Eliminar datos RUC

`DELETE {{baseUrl}}/api/mi-cuenta/datos-facturacion/{{datosFacturacionRucId}}`

- **Autorización:** Bearer `{{tokenCliente}}`
- **Nota:** Solo si no se usaron en un pedido.


## 10. Carrito y compra

### 10.1 Ver métodos de pago disponibles

`GET {{baseUrl}}/api/pagos/metodos`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.2 Agregar 1 polo al carrito

`POST {{baseUrl}}/api/carrito/productos`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "productoId": {{productoId}},
  "cantidad": 1
}
```

### 10.3 Ver carrito

`GET {{baseUrl}}/api/carrito`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.4 Cambiar cantidad a 3

`PUT {{baseUrl}}/api/carrito/productos/{{elementoId}}`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "cantidad": 3
}
```

### 10.5 Quitar el producto del carrito

`DELETE {{baseUrl}}/api/carrito/productos/{{elementoId}}`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.6 Agregar 1 polo otra vez

`POST {{baseUrl}}/api/carrito/productos`

- **Autorización:** Bearer `{{tokenCliente}}`

```json
{
  "productoId": {{productoId}},
  "cantidad": 1
}
```

### 10.7 Vaciar carrito

`DELETE {{baseUrl}}/api/carrito`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.8 Sincronizar carrito (2 polos)

`POST {{baseUrl}}/api/carrito/sincronizar`

- **Autorización:** Bearer `{{tokenCliente}}`
- **Nota:** Simula el carrito que el visitante armó sin sesión y se sube al iniciar sesión.

```json
{
  "elementos": [
    {
      "productoId": {{productoId}},
      "cantidad": 2
    }
  ]
}
```

### 10.9 Resumen de compra (con IGV)

`GET {{baseUrl}}/api/checkout/resumen`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.10 Resumen con código de descuento

`GET {{baseUrl}}/api/checkout/resumen?codigoDescuento=BIENVENIDA10`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.11 Comprar con boleta y descuento

`POST {{baseUrl}}/api/checkout`

- **Autorización:** Bearer `{{tokenCliente}}`
- **Nota:** tipoComprobante: BOLETA (requiere DNI) o FACTURA (requiere RUC).

```json
{
  "direccionId": {{direccionId}},
  "metodoPagoId": {{metodoPagoId}},
  "codigoDescuento": "BIENVENIDA10",
  "tipoComprobante": "BOLETA",
  "datosFacturacionId": {{datosFacturacionId}}
}
```

### 10.12 Ver mis pedidos

`GET {{baseUrl}}/api/pedidos`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.13 Ver detalle de mi pedido

`GET {{baseUrl}}/api/pedidos/{{pedidoId}}`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.14 Ver mis pagos

`GET {{baseUrl}}/api/pagos/transacciones`

- **Autorización:** Bearer `{{tokenCliente}}`

### 10.15 Ver detalle de un pago

`GET {{baseUrl}}/api/pagos/transacciones/{{transaccionId}}`

- **Autorización:** Bearer `{{tokenCliente}}`


## 11. Propietario gestiona la venta

### 11.1 Listar clientes

`GET {{baseUrl}}/api/clientes`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.2 Ver cliente

`GET {{baseUrl}}/api/clientes/{{clienteId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.3 Ver direcciones del cliente

`GET {{baseUrl}}/api/clientes/{{clienteId}}/direcciones`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.4 Listar pedidos confirmados

`GET {{baseUrl}}/api/gestion/pedidos?estado=CONFIRMADO`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.5 Ver detalle del pedido

`GET {{baseUrl}}/api/gestion/pedidos/{{pedidoId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.6 Pasar pedido a PREPARANDO

`PATCH {{baseUrl}}/api/gestion/pedidos/{{pedidoId}}/estado`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Flujo: CONFIRMADO → PREPARANDO → ENVIADO → ENTREGADO (o CANCELADO antes de enviar).

```json
{
  "estado": "PREPARANDO"
}
```

### 11.7 Pasar pedido a ENVIADO

`PATCH {{baseUrl}}/api/gestion/pedidos/{{pedidoId}}/estado`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "estado": "ENVIADO"
}
```

### 11.8 Pasar pedido a ENTREGADO

`PATCH {{baseUrl}}/api/gestion/pedidos/{{pedidoId}}/estado`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

```json
{
  "estado": "ENTREGADO"
}
```

### 11.9 Listar transacciones de la tienda

`GET {{baseUrl}}/api/gestion/transacciones`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.10 Ver transacción

`GET {{baseUrl}}/api/gestion/transacciones/{{transaccionId}}`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.11 Ver inventario (bajó a 18)

`GET {{baseUrl}}/api/inventario`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 11.12 Analítica: dashboard

`GET {{baseUrl}}/api/analitica/dashboard?desde=2026-01-01&hasta=2026-12-31`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Requiere estadísticas BASICAS (todos los planes).

### 11.13 Analítica: ventas

`GET {{baseUrl}}/api/analitica/ventas?desde=2026-01-01&hasta=2026-12-31`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Requiere plan Crecimiento o superior.

### 11.14 Analítica: productos más vendidos

`GET {{baseUrl}}/api/analitica/productos-mas-vendidos?desde=2026-01-01&hasta=2026-12-31&limite=5`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** Requiere plan Profesional.


## 12. Seguridad (estos errores son correctos)

### 12.1 Sin sesión: 401

`GET {{baseUrl}}/api/tiendas/mis-tiendas`

- **Autorización:** Sin token

### 12.2 Propietario sin X-Tenant-ID: 400

`GET {{baseUrl}}/api/productos`

- **Autorización:** Bearer `{{tokenPropietario}}`

### 12.3 Cliente en ruta de propietario: 403

`GET {{baseUrl}}/api/gestion/pedidos`

- **Autorización:** Bearer `{{tokenCliente}}` · `X-Tenant-ID: {{tiendaId}}`

### 12.4 Propietario en ruta de cliente: 403

`GET {{baseUrl}}/api/carrito`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`

### 12.5 Datos inválidos: 400

`POST {{baseUrl}}/api/auth/registro`

- **Autorización:** Sin token

```json
{
  "nombre": "",
  "correoElectronico": "no-es-correo",
  "contrasena": "123"
}
```


## 13. Cierre: cancelar y desactivar

### 13.1 Cancelar suscripción

`DELETE {{baseUrl}}/api/suscripciones/activa`

- **Autorización:** Bearer `{{tokenPropietario}}` · `X-Tenant-ID: {{tiendaId}}`
- **Nota:** La tienda deja de estar publicada de inmediato.

### 13.2 El público ya no ve la tienda

`GET {{baseUrl}}/api/publico/tiendas/{{slug}}`

- **Autorización:** Sin token

### 13.3 Desactivar tienda

`DELETE {{baseUrl}}/api/tiendas/{{tiendaId}}`

- **Autorización:** Bearer `{{tokenPropietario}}`

### 13.4 Reactivar tienda

`PATCH {{baseUrl}}/api/tiendas/{{tiendaId}}/activar`

- **Autorización:** Bearer `{{tokenPropietario}}`
