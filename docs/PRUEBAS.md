# Cómo probar ShopCloud

Esta guía reúne **las mismas pruebas con las que se verificó el frontend**, para que cualquiera del equipo pueda repetirlas y confirmar que todo funciona: después de un `git pull`, antes de una entrega o al cambiar algo del backend.

Hay tres niveles. Conviene hacerlos en este orden:

| Nivel | Qué prueba | Cuánto tarda |
|---|---|---|
| [1. Pruebas del backend](#1-pruebas-del-backend) | Las pruebas JUnit de Spring Boot (`mvnw test`) | ~1 minuto |
| [2. Pruebas de la API](#2-pruebas-de-la-api) | 11 scripts que hacen las **mismas llamadas que el frontend**: 175 comprobaciones | ~1 minuto |
| [3. Recorrido en el navegador](#3-recorrido-en-el-navegador) | El uso real, pantalla por pantalla, como lo haría un comerciante y un cliente | ~30 minutos |

Si los niveles 1 y 2 pasan, el backend y el frontend están de acuerdo en todo lo que se comprueba. El nivel 3 verifica además que las pantallas se vean y se comporten bien.

---

## 0. Preparación (una sola vez)

### Requisitos

- **PostgreSQL 17 o 18**, **JDK 22** y **Node.js 20 o superior**.
- Variables de entorno de Windows (*Inicio → "Editar las variables de entorno de esta cuenta"*):
  - `DB_PASSWORD`: la contraseña del usuario `postgres` de **tu** PostgreSQL.
  - `JWT_SECRET`: una clave aleatoria. Se puede generar en PowerShell con:
    ```powershell
    $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    [Environment]::SetEnvironmentVariable("JWT_SECRET", [Convert]::ToBase64String($b), "User")
    ```
  Después de crearlas, **cierra y vuelve a abrir** la terminal y el editor.

### Base de datos

```powershell
./database/aplicar.ps1             # esquema public: el que usa la aplicación
./database/aplicar.ps1 -Schema it  # esquema it: el que usan las pruebas del backend
```

Con PostgreSQL 18, agrega `-PsqlPath "C:\Program Files\PostgreSQL\18\bin\psql.exe"`, porque el script busca la versión 17. Si dice que el esquema ya tiene tablas, ya estaba creado: no es un error.

### Levantar todo (cada vez)

```powershell
# Terminal 1: backend en http://localhost:8080
cd backend
./mvnw spring-boot:run

# Terminal 2: frontend en http://localhost:5173
cd frontend
npm install        # solo la primera vez o si cambió package.json
npm run dev
```

Comprobación rápida: http://localhost:8080/api/planes debe mostrar 3 planes, y http://localhost:5173 la página de inicio con esos planes.

---

## 1. Pruebas del backend

```powershell
cd backend
./mvnw test
```

**Resultado esperado:** `Tests run: 70, Failures: 0, Errors: 0` y `BUILD SUCCESS`. Usan el esquema `it` de `shopcloud_test` y nunca tocan `public`.

---

## 2. Pruebas de la API

Están en `pruebas/api/`. Cada script crea **sus propias cuentas y tiendas**, con correos únicos `@pruebas.shopcloud.pe`, hace las llamadas que hace el frontend y comprueba las respuestas. No tocan tus datos y se pueden repetir las veces que quieras.

```powershell
# Con el backend en marcha, desde la raíz del repositorio:
node pruebas/api/todas.mjs           # todas, con resumen al final
node pruebas/api/07-checkout.mjs     # o solo una
```

Cada comprobación imprime `OK` o `XX`. Al final debe decir **"Todas las pruebas pasaron."**

```text
=== 07-checkout.mjs ===
Tienda prueba-checkout: Gorra (S/ 50, stock 2), Polo Talla M (S/ 45, stock 5), código VERANO (10%)
Métodos de pago (panel)
  OK  crear "Yape"
  OK  nombre repetido: 409 "Ya existe un método de pago con ese nombre"
  ...
27 de 27 comprobaciones OK
```

### Qué cubre cada archivo

| Archivo | PR | Comprueba |
|---|---|---|
| `01-auth.mjs` | #6 | CORS desde el puerto 5173, planes, registro (validaciones, correo repetido), login, `/auth/me` y token inválido |
| `02-tiendas.mjs` | #7 | Crear tienda (validaciones, slug con tildes, slug repetido), editar, `X-Tenant-ID` propio y ajeno, desactivar y reactivar |
| `03-catalogo.mjs` | #8 y #9 | Límites del plan (6.ª categoría, 4.ª imagen, reactivar con el plan lleno), `incluirInactivos`, SKU repetidos, categoría desactivada, imagen principal única, variantes con precio propio o heredado |
| `04-inventario.mjs` | #10 | Stock bajo, stock general vs. por variante, quitar el registro solo con 0, variantes eliminadas, productos sin stock |
| `05-suscripcion.mjs` | #11 | Prueba gratuita, cambiar el plan de la prueba, contratar (la tienda se publica), renovar (+1 mes), cancelar (solo lectura), tienda desactivada |
| `06-tienda-publica.mjs` | #12 | Catálogo público (solo activos), precios de variantes, stock, producto desactivado, tienda inexistente o en prueba |
| `07-checkout.mjs` | #13 | Métodos de pago, cuenta del cliente, sincronización del carrito, stock, resumen con IGV, descuento, DNI inválido, compra, stock descontado, datos guardados, factura |
| `08-pedidos.mjs` | #14 | Recorrido de estados, saltos y retrocesos no permitidos, cancelación (pago y comprobante anulados, stock devuelto), clientes, aislamiento entre tiendas |
| `09-descuentos.mjs` | #15 | Validaciones, códigos programados o vencidos, y cuándo aplica y cuándo no al pagar |
| `10-cuenta-cliente.mjs` | #16 | Mis pedidos, perfil, direcciones (la usada en un pedido no se borra), datos de facturación (RUC de 11 dígitos, sin repetidos) |
| `11-estadisticas.mjs` | #17 | Resumen con cifras cuadradas a mano, filtro de fechas, ventas por día, más vendidos y bloqueo según el plan |

### Variables opcionales

| Variable | Para qué | Por defecto |
|---|---|---|
| `API_URL` | Probar otro backend | `http://localhost:8080/api` |
| `DB_PASSWORD` | Solo `11-estadisticas.mjs`: mueve un pedido a hace 3 días directamente en la base | (la de tu sistema) |
| `PSQL` | Ruta de `psql` si no tienes PostgreSQL 17 | `C:/Program Files/PostgreSQL/17/bin/psql.exe` |

Ejemplo con PostgreSQL 18 (PowerShell):

```powershell
$env:PSQL = "C:/Program Files/PostgreSQL/18/bin/psql.exe"; node pruebas/api/todas.mjs
```

### Limpiar

Las pruebas dejan sus cuentas en la base. Para borrarlas todas:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d shopcloud_test -f pruebas/api/limpiar.sql
```

Solo borra las cuentas `@pruebas.shopcloud.pe` y todo lo de sus tiendas. Al final muestra cuántos propietarios y tiendas quedan.

> **Consejo:** antes de borrarlas, `11-estadisticas.mjs` imprime un correo y una contraseña. Con ellos puedes entrar al panel y ver las estadísticas con datos en el [paso 12](#paso-12-estadísticas).

---

## 3. Recorrido en el navegador

Es el uso real de la plataforma: primero como **comerciante** y después como **cliente**. Los pasos son los mismos con los que se probó cada PR.

- Cada paso dice **qué hacer** y **qué debe pasar** (✅).
- Al final de algunos pasos hay una consulta SQL para **confirmar en la base** que quedó registrado. Se puede ejecutar en pgAdmin, en la base `shopcloud_test`.

Usa una **base limpia** o tus propias cuentas. Los nombres de ejemplo (tienda-frutas, Polo, Piero) son los que se usaron al probar; cámbialos si ya existen.

### Paso 1. Cuenta del propietario

1. En http://localhost:5173 pulsa **Crear cuenta** y regístrate.
   - ✅ Entras directo al panel.
   - ✅ Si dejas campos vacíos o pones una contraseña de menos de 8 caracteres, el error sale **debajo de cada campo**.
2. **Cerrar sesión** y vuelve a entrar con **Iniciar sesión**.
   - ✅ Con una clave incorrecta dice "Correo o contraseña incorrectos".
3. Con la sesión cerrada, abre http://localhost:5173/panel.
   - ✅ Te manda al login.

### Paso 2. Tiendas

1. En el inicio del panel pulsa **Crear mi primera tienda**, elige un plan y ponle un nombre con tildes, por ejemplo "Tienda César".
   - ✅ La **dirección prevista** se actualiza mientras escribes (`/tienda/tienda-cesar`).
2. Crea una **segunda tienda** (por ejemplo "tienda-frutas") y cambia entre las dos con el **selector de tienda** de arriba.
3. En **Configuración**, cambia el color y pega la URL de un logo, por ejemplo `https://picsum.photos/id/1062/200`.
   - ✅ Se ve en **Mis tiendas**.
4. **Desactiva** la tienda.
   - ✅ El formulario se bloquea y aparece un aviso gris.
   - Después **reactívala**.

```sql
SELECT t.nombre, t.slug, t.activo, t.color_primario, p.nombre AS plan, s.tipo
FROM tiendas t
JOIN suscripciones s ON s.tienda_id = t.id AND s.estado = 'ACTIVA'
JOIN planes p ON p.id = s.plan_id;
```

### Paso 3. Catálogo

Con "tienda-frutas" como tienda activa:

1. **Categorías:** crea "Ropa" y "Comida". Desactiva una y reactívala desde la pestaña **Desactivadas**.
   - ✅ Arriba se ve el uso del plan: "2 de 5 categorías activas".
2. **Productos → Nuevo producto:** "Polo", S/ 20, categoría Ropa.
   - ✅ Al crearlo te lleva a su detalle.
3. **Imágenes:** agrega `https://picsum.photos/id/10/400`, `https://picsum.photos/id/20/400` y `https://picsum.photos/id/30/400`.
   - ✅ Con el plan Emprendedor, a la tercera se bloquea el formulario ("máximo de imágenes de tu plan").
   - Cambia la **imagen principal**.
4. **Variantes:** "Talla S" sin precio (usa el del producto), "Talla M" con S/ 25 y "Talla L" con S/ 30.
5. Desactiva el Polo y búscalo en **Productos → Desactivados**. Reactívalo.

### Paso 4. Inventario

1. En el **Inicio** del panel aparece el aviso **"1 producto sin stock registrado"**. Haz clic.
2. En **Sin stock registrado → Registrar stock** te lleva a la sección Inventario del Polo. Registra:
   - Talla S: **10**, mínimo 3 → ✅ **Disponible**
   - Talla M: **2**, mínimo 3 → ✅ **Stock bajo**
   - Talla L: **0** → ✅ **Agotado**
3. Vuelve al **Inicio**.
   - ✅ Ahora dice **"1 producto con stock bajo"**.
4. Crea un producto **sin variantes**, por ejemplo "Pantalón", y regístrale stock general.
   - Intenta agregarle una variante: ✅ la sección explica que no se puede porque tiene stock general.
   - Deja su stock en 0, **Quitar registro** y agrega la variante: ✅ ahora sí funciona.

```sql
SELECT p.nombre, coalesce(v.nombre, '(general)') AS variante, i.cantidad, i.cantidad_minima,
       CASE WHEN i.cantidad = 0 THEN 'Agotado' WHEN i.cantidad <= i.cantidad_minima THEN 'Stock bajo' ELSE 'Disponible' END AS estado
FROM inventario i
JOIN productos p ON p.id = i.producto_id
LEFT JOIN variantes v ON v.id = i.variante_id
ORDER BY p.id, v.id;
```

### Paso 5. Suscripción

1. En **Suscripción**, pulsa **Probar este plan** en otro plan.
   - ✅ Cambia el plan de la prueba, pero **no** la fecha de fin.
2. **Contrata** un plan y confirma el pago (simulado).
   - ✅ El aviso amarillo del panel desaparece: la tienda queda **publicada**.
3. Mira el **Historial**.
   - ✅ La prueba aparece como "Cerrada" y el pago como "Vigente".

> No canceles la suscripción de la tienda que vas a usar para comprar. Si quieres probar **Cancelar suscripción**, hazlo con la otra tienda: queda en solo lectura y su tienda pública deja de verse.

```sql
SELECT t.slug, p.nombre AS plan, s.tipo, s.estado, s.fecha_inicio, s.fecha_fin, s.monto_pagado
FROM suscripciones s
JOIN tiendas t ON t.id = s.tienda_id
JOIN planes p ON p.id = s.plan_id
ORDER BY t.id, s.id;
```

### Paso 6. Métodos de pago

1. En **Métodos de pago**, crea "Yape" con un número en "Datos para pagar".
   - ✅ Sin al menos un método activo, los clientes no pueden comprar; la pantalla lo avisa.

### Paso 7. Tienda pública y carrito

1. Abre http://localhost:5173/tienda/tienda-frutas, o haz clic en la dirección desde el Inicio del panel.
2. El **Polo** debe decir **"Desde S/ 20.00"** (porque sus tallas tienen precios distintos) y el **Pantalón** **"Agotado"**.
3. En el Polo:
   - la **Talla L** sale tachada;
   - en la **Talla M**, que tiene 2, agrega 2: ✅ el botón se bloquea ("Ya tienes en el carrito todo el stock disponible").
4. En el **carrito**, cambia cantidades, quita algo y **recarga la página**.
   - ✅ El carrito se mantiene.
5. Abre la dirección de la tienda que sigue en prueba (`/tienda/tienda-cesar`).
   - ✅ Dice **"Tienda no disponible"**.

### Paso 8. Compra como cliente

1. **Sin iniciar sesión**, agrega 2 Polos Talla S al carrito y pulsa **Continuar con la compra**.
   - ✅ Te pide ingresar. Crea una **cuenta de cliente** (por ejemplo "Piero").
2. Vuelves al checkout con el carrito **ya pasado a tu cuenta**.
   - Agrega una **dirección**, elige **Yape** y pide **boleta** con un DNI de 8 dígitos.
   - ✅ Con un DNI de menos dígitos, el error sale debajo del campo.
3. **Paga.**
   - ✅ Sale "¡Gracias por tu compra!", con el número de boleta (`B001-…`), el pago y el detalle.
4. En el panel, **Inventario**.
   - ✅ La Talla S bajó de 10 a **8**.

```sql
SELECT p.id, c.nombre AS cliente, p.estado, p.subtotal, p.monto_descuento, p.base_imponible, p.monto_igv, p.total,
       p.numero_comprobante, t.estado AS pago
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
LEFT JOIN transacciones t ON t.pedido_id = p.id
ORDER BY p.id;
```

✅ El pedido aparece **CONFIRMADO**, la base imponible más el IGV suman el total, y el pago está **REALIZADA**. El carrito del cliente queda `CONVERTIDO` (`SELECT estado FROM carritos`).

### Paso 9. Descuentos

1. En **Descuentos**, crea **VERANO10** con 10%.
   - ✅ Aparece como **Vigente**.
2. Crea otro con fecha de inicio la próxima semana.
   - ✅ Aparece como **Programado**.
3. En la tienda, como el cliente, agrega algo al carrito y en el checkout escribe **verano10** (en minúsculas).
   - ✅ Descuenta el 10%.
4. Prueba el código programado.
   - ✅ Dice "El código de descuento no está vigente".

### Paso 10. Pedidos en el panel

1. En el **Inicio** aparece el aviso **"N pedidos nuevos por preparar"**. Haz clic y abre el pedido del paso 8.
2. Avánzalo con **Empezar a preparar** y luego **Marcar como enviado**.
   - ✅ En cuanto está enviado, el botón **Cancelar** desaparece.
3. Termina con **Marcar como entregado**.
4. Haz **otra compra** como cliente y **cancélala** desde el panel.
   - ✅ El pago y la boleta quedan **anulados**.
   - ✅ En Inventario, **el stock volvió**.
5. En **Clientes**, abre al cliente.
   - ✅ Muestra sus pedidos, su dirección y el total comprado, sin contar lo cancelado.

```sql
SELECT p.id, p.estado, p.numero_comprobante, p.estado_comprobante, t.estado AS pago, p.actualizado_en
FROM pedidos p
LEFT JOIN transacciones t ON t.pedido_id = p.id
ORDER BY p.id;
```

### Paso 11. Cuenta del cliente

En la tienda, con la sesión del cliente:

1. Haz clic en **"Hola, Piero"**. En **Mis pedidos**:
   - ✅ El pedido entregado dice "Tu pedido fue entregado".
   - ✅ El cancelado dice "Pedido cancelado".
2. En **Mis datos**, cambia el teléfono y guarda.
3. Intenta **eliminar** la dirección que usaste al comprar.
   - ✅ Sale un aviso de que no se puede, porque se usó en un pedido.
4. Agrega **datos de factura**:
   - con un RUC de 10 dígitos ✅ se queja;
   - con 11 ✅ se guarda.

### Paso 12. Estadísticas

1. Con "tienda-frutas" (plan **Emprendedor**), abre **Estadísticas**.
   - ✅ Se ve el **resumen**.
   - ✅ **Ventas por día** y **Más vendidos** aparecen **bloqueados**, con el texto "Disponible desde el plan …".
2. Para ver todo con datos, corre `node pruebas/api/11-estadisticas.mjs` y entra al panel con el correo que imprime al final (contraseña `clave12345`).
   - En la tienda **"Estadísticas Profesional"**:
     - ✅ El gráfico muestra columnas finas, con el valor del día más alto encima.
     - ✅ El detalle aparece al pasar el mouse o con **Tab** y las flechas **← →**.
     - ✅ **"Ver como tabla"** muestra los mismos datos.
   - En **"Estadísticas Crecimiento"** ✅ solo el ranking está bloqueado.
   - En **"Estadísticas Emprendedor"** ✅ se ve solo el resumen.
3. Prueba los períodos (7, 30, 90 días, Otro rango).
   - ✅ Todo se recalcula.

---

## Lista final

Antes de una entrega, todo esto debe estar en ✅:

- [ ] `./mvnw test` → 70 pruebas, 0 fallos
- [ ] `node pruebas/api/todas.mjs` → "Todas las pruebas pasaron."
- [ ] `cd frontend; npm run lint; npm run build` → sin errores
- [ ] Recorrido en el navegador, pasos 1 a 12
- [ ] Datos de prueba borrados con `pruebas/api/limpiar.sql`, si no se van a usar en la presentación
