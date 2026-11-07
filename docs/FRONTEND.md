# Frontend de ShopCloud: guía para el equipo

Esta guía cuenta **qué se hizo en el frontend, cómo está armado y por qué**. Está pensada para quien trabajó en el backend y necesita entender el frontend para revisarlo, probarlo o seguir desarrollándolo.

- Para **ejecutarlo**: [`frontend/README.md`](../frontend/README.md).
- Para **probar que todo funciona**: [`docs/PRUEBAS.md`](PRUEBAS.md).
- Para la **API**: [`docs/API_BACKEND.md`](API_BACKEND.md).

## Contenido

1. [Qué se hizo](#1-qué-se-hizo)
2. [Las tres partes de la aplicación](#2-las-tres-partes-de-la-aplicación)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Cómo habla con el backend](#4-cómo-habla-con-el-backend)
5. [Reglas del backend que respeta la interfaz](#5-reglas-del-backend-que-respeta-la-interfaz)
6. [Decisiones de diseño](#6-decisiones-de-diseño)
7. [El único cambio en el backend](#7-el-único-cambio-en-el-backend)
8. [Observaciones pendientes para el backend](#8-observaciones-pendientes-para-el-backend)
9. [Problemas comunes](#9-problemas-comunes)
10. [Cómo agregar una pantalla nueva](#10-cómo-agregar-una-pantalla-nueva)

---

## 1. Qué se hizo

El frontend se construyó por partes, cada una en su rama `feature/cesar-*` y con su Pull Request hacia `develop`. Cada PR explica en detalle qué hace y cómo se probó.

| PR | Parte | Qué agrega |
|---|---|---|
| #6 | Base | Proyecto React con Vite, Tailwind, React Router y Axios. Cliente de la API, login y registro del propietario |
| #7 | Tiendas | Mis tiendas, crear tienda con plan de prueba, selector de tienda activa, configuración, desactivar y reactivar |
| #8 | **Backend** | `?incluirInactivos=true` en los listados de categorías y productos (ver [sección 7](#7-el-único-cambio-en-el-backend)) |
| #9 | Catálogo | Categorías, productos, imágenes (por URL) y variantes, con los límites del plan |
| #10 | Inventario | Stock general o por variante, stock bajo, productos sin stock y avisos en el inicio |
| #11 | Suscripción | Contratar, renovar, cambiar el plan de la prueba y cancelar (pago simulado) |
| #12 | Tienda pública | `/tienda/:slug`: catálogo, producto y carrito en el navegador |
| #13 | Checkout | Cuenta del cliente, sincronización del carrito, compra con boleta o factura, y métodos de pago en el panel |
| #14 | Pedidos | Gestión de pedidos (estados y cancelación) y clientes en el panel |
| #15 | Descuentos | Códigos de descuento por porcentaje o monto fijo, con vigencia |
| #16 | Cuenta del cliente | Mis pedidos, perfil, direcciones y datos de facturación |
| #17 | Estadísticas | Resumen, ventas por día y más vendidos, según el plan |

Con esto, **todas las rutas de `docs/API_BACKEND.md` tienen su pantalla.**

**Tecnologías:** React 19, Vite 8, React Router 8, Axios y Tailwind CSS 4, en JavaScript (sin TypeScript). El linter es oxlint (`npm run lint`). No se agregaron otras librerías: el gráfico de estadísticas está hecho a mano en SVG.

---

## 2. Las tres partes de la aplicación

El frontend es una sola aplicación con tres zonas, cada una con su propio layout (`src/layouts/`):

### Sitio de la plataforma (`PublicoLayout`)

| Ruta | Página |
|---|---|
| `/` | Página de inicio con los planes reales (`GET /api/planes`) |
| `/login`, `/registro` | Cuenta del **propietario** |

### Panel del propietario (`PanelLayout`, requiere sesión)

| Ruta | Página |
|---|---|
| `/panel` | Inicio: resumen de la tienda activa y avisos (pedidos por preparar, stock bajo, productos sin stock) |
| `/panel/tiendas`, `/panel/tiendas/nueva` | Mis tiendas y crear tienda |
| `/panel/pedidos`, `/panel/pedidos/:id` | Pedidos: lista por estado y detalle con sus acciones |
| `/panel/estadisticas` | Estadísticas según el plan |
| `/panel/productos`, `/panel/productos/nuevo`, `/panel/productos/:id` | Productos. El detalle incluye imágenes, variantes e inventario |
| `/panel/categorias` | Categorías |
| `/panel/inventario` | Todo el stock, stock bajo y productos sin stock |
| `/panel/clientes`, `/panel/clientes/:id` | Clientes de la tienda |
| `/panel/descuentos` | Códigos de descuento |
| `/panel/metodos-pago` | Métodos de pago |
| `/panel/suscripcion` | Plan, pagos e historial |
| `/panel/configuracion` | Datos de la tienda, desactivar y reactivar |

La barra superior tiene el **selector de tienda**: la tienda elegida es la que se envía en `X-Tenant-ID`. Las páginas que trabajan sobre ella están dentro de `RequiereTienda`, que manda al inicio si todavía no hay tiendas.

### Tienda pública de cada comerciante (`TiendaPublicaLayout`)

Usa el logo, el banner y el color de la tienda. Solo existe si la tienda tiene un **plan pagado vigente**; si no, muestra "Tienda no disponible".

| Ruta | Página |
|---|---|
| `/tienda/:slug` | Catálogo con filtro por categoría y buscador |
| `/tienda/:slug/producto/:id` | Producto: galería, elección de variante y cantidad |
| `/tienda/:slug/carrito` | Carrito |
| `/tienda/:slug/ingresar`, `/registro` | Cuenta del **cliente** en esa tienda |
| `/tienda/:slug/checkout` | Finalizar compra |
| `/tienda/:slug/pedido/:id` | Confirmación y detalle de un pedido |
| `/tienda/:slug/cuenta/pedidos`, `/cuenta` | Mis pedidos y Mis datos |

---

## 3. Estructura de carpetas

```text
frontend/src/
  api/          una función por endpoint, agrupadas por módulo (tiendas.js, productos.js, gestion.js...)
    cliente.js        instancias de Axios: apiPublica y apiPropietario
    clienteTienda.js  instancia por tienda para el cliente (token del cliente)
    errores.js        convierte las respuestas de error en ErrorApi
    sesion.js         lo que se guarda en localStorage (sesiones, tienda activa, carrito)
  context/      estado global: AuthContext (propietario), TiendaContext (tiendas y tienda activa),
                TiendaPublicaContext (tienda visitada, cliente y carrito)
  hooks/        useDatos (cargar datos de la API) y usePlanTienda (límites del plan actual)
  layouts/      PublicoLayout, PanelLayout, TiendaPublicaLayout
  pages/        una carpeta por zona: auth/, panel/ (catalogo/, pedidos/, clientes/, tiendas/), tienda/
  components/   ui/ (Boton, Campo, Alerta, Insignia, Pestanas, BotonConfirmar...) y uno por módulo
                (catalogo/, inventario/, pedidos/, tienda/, tienda-publica/, estadisticas/)
  utils/        formato de soles y fechas, estados de pedido y tienda, slug, colores...
```

Cada archivo de `api/` empieza con un comentario que explica qué devuelve el endpoint y qué reglas del backend aplican. Antes de usar un endpoint conviene leerlo.

---

## 4. Cómo habla con el backend

### Tres instancias de Axios

| Instancia | Para | Qué agrega |
|---|---|---|
| `apiPublica` | Rutas sin sesión: planes, catálogo público, login y registro | Nada |
| `apiPropietario` | Rutas del panel | `Authorization` con el token del propietario y `X-Tenant-ID` con la tienda activa. Si la API responde **401**, cierra la sesión y vuelve al login |
| `clienteTienda.js` (una por tienda) | Rutas del cliente (`/carrito`, `/checkout`, `/mi-cuenta`, `/pedidos`) | `Authorization` con el token **del cliente de esa tienda**. No envía `X-Tenant-ID`, porque la tienda va en el token. Un 401 cierra la sesión del cliente |

`X-Tenant-ID` se envía siempre que haya una tienda elegida. El backend solo la lee en las rutas de una tienda y la ignora en `/auth`, `/tiendas` y `/usuarios`.

### Errores

Todas las respuestas de error (`application/problem+json`) se convierten en un `ErrorApi` con:

- `status`: código HTTP, o 0 si el backend no responde;
- `codigo`: código de negocio, como `LIMITE_PLAN`, `SUSCRIPCION_REQUERIDA` o `FUNCIONALIDAD_NO_INCLUIDA`;
- `errores`: errores de validación por campo, por ejemplo `{ nombre: 'El nombre es obligatorio' }`;
- `message`: el `detail` del backend, listo para mostrar.

Los formularios muestran `errores.campo` debajo de cada input. Por eso **los nombres de los campos del formulario son los mismos que los de los DTO**.

### Qué se guarda en el navegador (localStorage)

| Clave | Contenido |
|---|---|
| `shopcloud.propietario` | Token y datos del propietario |
| `shopcloud.tiendaActual` | Id de la tienda activa (la de `X-Tenant-ID`) |
| `shopcloud.cliente.{slug}` | Token y datos del cliente en esa tienda |
| `shopcloud.carrito.{slug}` | Carrito del visitante antes de iniciar sesión |

### Cargar datos: `useDatos`

Las páginas cargan datos con `useDatos(cargar)`, que devuelve `{ datos, cargando, error, recargar, setDatos }`. Después de un POST o PUT, la pantalla se actualiza con `setDatos` usando la respuesta del backend, sin volver a pedir la lista. Si una respuesta llega tarde, cuando ya hubo un cambio más reciente, se descarta.

---

## 5. Reglas del backend que respeta la interfaz

El frontend no inventa reglas: muestra las del backend antes de que el usuario choque con ellas. Las principales:

- **Situación de la tienda** (tabla de `API_BACKEND.md`):
  - **en prueba**: se puede configurar, pero no es visible al público;
  - **sin plan vigente**: solo lectura, y los botones de cambio se deshabilitan;
  - **desactivada**: no se puede editar.

  Un aviso arriba del panel lo explica y enlaza a Suscripción o a Configuración.
- **Límites del plan**: los listados muestran el uso, por ejemplo "3 de 5 categorías activas". Al llegar al límite se oculta el botón de crear.
- **Desactivar no borra**: en categorías, productos, métodos de pago y descuentos, "desactivar" libera cupo, y hay una pestaña o botón para reactivar. Las imágenes sí se borran.
- **Inventario**: un producto lleva stock general **o** por variante, nunca ambos. Con stock general no se pueden crear variantes, y la pantalla explica cómo cambiar. Un registro solo se quita con stock 0. **Un producto sin registro de inventario no se puede comprar**.
- **Carrito**: si el producto tiene variantes, hay que elegir una. La cantidad máxima es el stock menos lo que ya está en el carrito.
- **Comprobantes**: boleta con DNI de 8 dígitos, factura con RUC de 11. Se valida antes de enviar.
- **Pedidos**: solo se muestra el botón del siguiente estado permitido (confirmado → en preparación → enviado → entregado). Se puede cancelar hasta antes de enviar, lo que anula el pago y el comprobante y devuelve el stock.
- **Suscripción**: con un plan pagado vigente solo se puede renovar el mismo plan.
- **Estadísticas**: cada sección se pide por separado. Si el plan no la incluye (403 `FUNCIONALIDAD_NO_INCLUIDA`), se muestra bloqueada.

---

## 6. Decisiones de diseño

- **El carrito tiene dos modos.**
  - Sin sesión, vive en el navegador (`shopcloud.carrito.{slug}`) y guarda solo `{ productoId, varianteId, cantidad }`, el mismo formato que `POST /api/carrito/sincronizar`.
  - Al iniciar sesión se sincroniza con el backend, se muestran sus avisos (cantidades ajustadas, productos que ya no existen) y se vacía el del navegador.
  - Con sesión, cada cambio va al backend.
- **Precios y stock siempre del catálogo.** El carrito del navegador no guarda precios: los toma del catálogo actual. En la compra, el backend recalcula todo e ignora los montos que envía el cliente.
- **Una sesión de cliente por tienda.** El mismo correo puede tener cuentas distintas en tiendas distintas, igual que en el backend.
- **Imágenes por URL.** El backend no recibe archivos, así que se pega la URL de una imagen publicada en internet. Se muestra una vista previa.
- **Color de cada tienda.** La tienda pública usa el `colorPrimario` de la tienda. El texto sobre ese color se elige blanco o casi negro según su luminancia (`utils/color.js`), para que un amarillo siga siendo legible.
- **Fechas.** El backend envía fechas sin zona horaria, en hora de Lima. Las fechas `'YYYY-MM-DD'` se interpretan como hora local: `new Date('2026-11-01')` las tomaría como UTC y en Perú mostraría el día anterior.
- **El plan se identifica por su nombre.** `TiendaRespuestaDTO` trae `planNombre`, pero no el `planId` ni los límites, así que `usePlanTienda` busca el plan por nombre en `GET /api/planes`. Ver [sección 8](#8-observaciones-pendientes-para-el-backend).
- **Gráfico sin librerías.** Las ventas por día son un SVG propio:
  - columnas de 24px como máximo, con la punta redondeada;
  - tooltip al pasar el mouse o con las flechas del teclado;
  - vista de tabla, para que ningún dato dependa del gráfico;
  - el color pasó un validador de paleta (contraste y daltonismo).

---

## 7. El único cambio en el backend

**PR #8.** `GET /api/categorias` y `GET /api/productos` aceptan `?incluirInactivos=true`.

**Por qué:** `DELETE` desactiva en lugar de borrar, y existe `PATCH .../activar`, pero los listados solo devolvían los activos. Así no había forma de ver los desactivados para reactivarlos.

**Qué incluye:**
- Sin el parámetro, el comportamiento es el de siempre.
- Una prueba de integración (`losListadosIncluyenLosDesactivadosSoloSiSeSolicitan`). La suite quedó en 70 pruebas, sin fallos.
- La documentación en `API_BACKEND.md`.

---

## 8. Observaciones pendientes para el backend

Aparecieron al construir y probar el frontend. **No afectan el funcionamiento actual**, pero conviene revisarlas.

1. **Numeración de comprobantes global** (`CheckoutService.java`). El número es el id del pedido (`String.format("%s-%08d", serie, pedido.getId())`). Por eso lo comparten todas las tiendas y también boletas y facturas: la primera boleta de una tienda puede salir `B001-00000004`. Lo normal sería un correlativo por tienda y por serie.
2. **Cuenta del cliente cuando la tienda pierde su plan.** El backend permite que el cliente consulte sus pedidos (`CONSULTAS_HISTORICAS` en `TenantInterceptor`). Pero `GET /api/publico/tiendas/{slug}` responde 404, y el frontend, que necesita la tienda para dibujar su cabecera, muestra "Tienda no disponible". Se podría resolver en el frontend mostrando la cuenta sin los datos de la tienda, o en el backend con un endpoint mínimo de la tienda para sus clientes.
3. **`TiendaRespuestaDTO` sin `planId` ni límites.** El frontend reconoce el plan por su nombre. Si se desactiva un plan que todavía tienen algunas tiendas, el panel no muestra sus límites, aunque el backend los sigue aplicando.

---

## 9. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| La página se ve **sin estilos** | Después de cambiar de rama o de un `git pull`, Vite se reinicia solo y a veces Tailwind deja de procesar el CSS. Detén `npm run dev` (`Ctrl + C`), vuelve a ejecutarlo y recarga con `Ctrl + F5` |
| `"vite" no se reconoce...` después de `npm ci` | En Windows, `npm ci` con `npm run dev` corriendo deja `node_modules` a medias. Detén el servidor y vuelve a ejecutar `npm ci` |
| Error de CORS o "No se pudo conectar con el servidor" | El backend solo acepta `http://localhost:5173`, que es el puerto fijo de Vite (`strictPort`). Revisa que el backend esté en `http://localhost:8080` y que nada más use el 5173 |
| Te saca de la sesión de repente | El token dura 24 horas. Al vencer, la API responde 401 y el frontend cierra la sesión: es lo esperado |
| Con `curl` en Git Bash, los nombres con tildes dan "El cuerpo JSON no es válido" | Es la terminal de Windows, que envía mal las tildes. Desde el navegador, Node o Postman funciona bien |
| "Tienda no disponible" en `/tienda/...` | La tienda no existe o no tiene plan pagado vigente: en prueba gratuita no se ve. Contrata un plan en Suscripción (pago simulado) |
| No se puede comprar un producto | Revisa que tenga stock registrado (Inventario → "Sin stock registrado") y que la tienda tenga al menos un método de pago activo |

---

## 10. Cómo agregar una pantalla nueva

1. **API:** agrega las funciones en `src/api/<modulo>.js`, usando `apiPropietario`, `apiPublica` o `clienteTienda.js`. Documenta en un comentario qué devuelve y qué reglas aplica.
2. **Página:** crea el componente en `src/pages/...`.
   - Carga los datos con `useDatos(useCallback(() => miFuncion(), []))`.
   - Muestra los errores con `<Alerta>`.
   - En los formularios usa `<Campo>` con `error={errores.campo}`, y los mismos nombres de campo que el DTO.
3. **Ruta:** regístrala en `src/App.jsx`. Si trabaja sobre la tienda activa, ponla dentro de `<RequiereTienda>`.
4. **Menú:** si va en el panel, agrégala a `SECCIONES` en `src/layouts/PanelLayout.jsx`.
5. **Permisos:** si cambia datos, deshabilita los botones cuando `tienda.administrable` sea `false`.
6. **Verifica:** `npm run lint`, `npm run build`, y una prueba en `pruebas/api/` (ver `docs/PRUEBAS.md`).
