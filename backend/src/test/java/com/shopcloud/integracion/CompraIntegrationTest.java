package com.shopcloud.integracion;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CompraIntegrationTest extends IntegracionBase {

    private String propietario;
    private Long tienda;
    private Long metodoPago;
    private String cliente;
    private Long direccion;

    @BeforeEach
    void prepararTienda() throws Exception {
        propietario = registrarPropietario("duena@tienda.pe");
        tienda = crearTiendaPublicada(propietario, "publicada");
        metodoPago = crearMetodoPago(propietario, tienda, "Yape");
        cliente = registrarCliente("publicada", "ana@correo.pe");
        direccion = crearDireccion(cliente);
    }

    private int stock(Long producto) {
        return entero("SELECT cantidad FROM inventario WHERE producto_id = ?", producto);
    }

    private ResultActions comprar() throws Exception {
        return post("/api/checkout", cliente, null, boleta(direccion, metodoPago));
    }

    private void crearDescuento(String codigo, String tipo, String valor, LocalDateTime inicio, LocalDateTime fin)
            throws Exception {
        post("/api/descuentos", propietario, tienda, Map.of(
                "codigo", codigo,
                "tipo", tipo,
                "valor", valor,
                "fechaInicio", inicio.toString(),
                "fechaFin", fin.toString()
        )).andExpect(status().isCreated());
    }

    private void crearDescuentoVigente(String codigo, String tipo, String valor) throws Exception {
        crearDescuento(codigo, tipo, valor,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(1));
    }

    @Test
    void elCarritoAcumulaYRecalculaConLosPreciosDelCatalogo() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "50.00", 10);

        alCarrito(cliente, producto, 2);
        alCarrito(cliente, producto, 1);

        get("/api/carrito", cliente, null)
                .andExpect(jsonPath("$.elementos", hasSize(1)))
                .andExpect(jsonPath("$.elementos[0].cantidad").value(3))
                .andExpect(jsonPath("$.total").value(150.00));
        assertThat(entero("SELECT count(*) FROM carritos WHERE estado = 'ACTIVO'")).isEqualTo(1);

        // Si el precio cambia, el carrito refleja el nuevo.
        put("/api/productos/" + producto, propietario, tienda, Map.of("nombre", "Polo", "precio", "60.00"))
                .andExpect(status().isOk());
        get("/api/carrito", cliente, null).andExpect(jsonPath("$.total").value(180.00));

        // La cantidad no puede superar el stock.
        post("/api/carrito/productos", cliente, null, Map.of("productoId", producto, "cantidad", 8))
                .andExpect(status().isConflict());
    }

    @Test
    void elCarritoSeActualizaYSeVacia() throws Exception {
        Long uno = crearProductoConStock(propietario, tienda, "Uno", "10.00", 5);
        Long dos = crearProductoConStock(propietario, tienda, "Dos", "20.00", 5);
        alCarrito(cliente, uno, 1);
        alCarrito(cliente, dos, 1);

        Number elemento = leer(get("/api/carrito", cliente, null), "$.elementos[0].id");

        put("/api/carrito/productos/" + elemento, cliente, null, Map.of("cantidad", 4))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(60.00));

        delete("/api/carrito/productos/" + elemento, cliente, null).andExpect(status().isNoContent());
        get("/api/carrito", cliente, null).andExpect(jsonPath("$.total").value(20.00));

        delete("/api/carrito", cliente, null).andExpect(status().isNoContent());
        get("/api/carrito", cliente, null).andExpect(jsonPath("$.total").value(0.0));
    }

    @Test
    void sincronizarElCarritoDelNavegadorEsRepetibleYSeAjustaAlStock() throws Exception {
        Long disponible = crearProductoConStock(propietario, tienda, "Disponible", "10.00", 3);
        Long retirado = crearProductoConStock(propietario, tienda, "Retirado", "10.00", 3);
        delete("/api/productos/" + retirado, propietario, tienda).andExpect(status().isNoContent());

        Map<String, Object> cuerpo = Map.of("elementos", List.of(
                Map.of("productoId", disponible, "cantidad", 9),
                Map.of("productoId", retirado, "cantidad", 1)
        ));

        post("/api/carrito/sincronizar", cliente, null, cuerpo)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.elementos", hasSize(1)))
                .andExpect(jsonPath("$.elementos[0].cantidad").value(3))
                .andExpect(jsonPath("$.total").value(30.00))
                .andExpect(jsonPath("$.advertencias", hasSize(2)));

        post("/api/carrito/sincronizar", cliente, null, cuerpo)
                .andExpect(jsonPath("$.elementos[0].cantidad").value(3));
    }

    @Test
    void elCheckoutGeneraPedidoBoletaTransaccionYActualizaStock() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "59.00", 10);
        alCarrito(cliente, producto, 2);

        Number pedido = leer(comprar()
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("CONFIRMADO"))
                .andExpect(jsonPath("$.subtotal").value(118.00))
                .andExpect(jsonPath("$.montoDescuento").value(0))
                .andExpect(jsonPath("$.baseImponible").value(100.00))
                .andExpect(jsonPath("$.porcentajeIgv").value(18.00))
                .andExpect(jsonPath("$.montoIgv").value(18.00))
                .andExpect(jsonPath("$.total").value(118.00))
                .andExpect(jsonPath("$.lineaDireccion").value("Av. Arequipa 123"))
                .andExpect(jsonPath("$.comprobante.tipo").value("BOLETA"))
                .andExpect(jsonPath("$.comprobante.estado").value("GENERADO"))
                .andExpect(jsonPath("$.comprobante.numero").value(org.hamcrest.Matchers.startsWith("B001-")))
                .andExpect(jsonPath("$.comprobante.tipoDocumento").value("DNI"))
                .andExpect(jsonPath("$.comprobante.numeroDocumento").value("12345678"))
                .andExpect(jsonPath("$.transaccion.estado").value("REALIZADA"))
                .andExpect(jsonPath("$.transaccion.monto").value(118.00))
                .andExpect(jsonPath("$.elementos[0].nombreProducto").value("Polo")), "$.id");

        assertThat(stock(producto)).isEqualTo(8);
        assertThat(entero("SELECT count(*) FROM transacciones WHERE pedido_id = ?", pedido)).isEqualTo(1);
        assertThat(entero("SELECT count(*) FROM carritos WHERE estado = 'CONVERTIDO'")).isEqualTo(1);

        // El siguiente carrito es nuevo; no se puede repetir la compra.
        comprar().andExpect(status().isConflict());
    }

    @Test
    void elPedidoConservaSusDatosAunqueCambieElCatalogo() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Nombre original", "50.00", 10);
        alCarrito(cliente, producto, 1);
        Number pedido = leer(comprar().andExpect(status().isCreated()), "$.id");

        put("/api/productos/" + producto, propietario, tienda, Map.of("nombre", "Otro nombre", "precio", "99.00"))
                .andExpect(status().isOk());
        put("/api/mi-cuenta/direcciones/" + direccion, cliente, null, Map.of(
                "lineaDireccion", "Otra dirección", "ciudad", "Cusco"
        )).andExpect(status().isOk());
        delete("/api/productos/" + producto, propietario, tienda).andExpect(status().isNoContent());

        get("/api/pedidos/" + pedido, cliente, null)
                .andExpect(jsonPath("$.elementos[0].nombreProducto").value("Nombre original"))
                .andExpect(jsonPath("$.elementos[0].precioUnitario").value(50.00))
                .andExpect(jsonPath("$.lineaDireccion").value("Av. Arequipa 123"))
                .andExpect(jsonPath("$.ciudad").value("Lima"));

        // Lo usado en un pedido no se borra físicamente.
        delete("/api/mi-cuenta/direcciones/" + direccion, cliente, null).andExpect(status().isConflict());
        assertThat(entero("SELECT count(*) FROM productos WHERE id = ? AND activo = false", producto)).isEqualTo(1);
    }

    @Test
    void varianteUsaSuPrecioYSuPropioStockEnLaCompra() throws Exception {
        Long producto = crearProducto(propietario, tienda, "Polo", "50.00");
        Long variante = id(post("/api/productos/" + producto + "/variantes", propietario, tienda,
                Map.of("nombre", "Edición especial", "sku", "POLO-ESP", "precio", "75.00"))
                .andExpect(status().isCreated()));
        crearStock(propietario, tienda, producto, variante, 3);

        // Sin indicar la variante no hay inventario general que vender.
        post("/api/carrito/productos", cliente, null, Map.of("productoId", producto, "cantidad", 1))
                .andExpect(status().isNotFound());

        post("/api/carrito/productos", cliente, null, Map.of(
                "productoId", producto, "varianteId", variante, "cantidad", 2
        )).andExpect(status().isOk());

        comprar()
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(150.00))
                .andExpect(jsonPath("$.elementos[0].nombreVariante").value("Edición especial"))
                .andExpect(jsonPath("$.elementos[0].sku").value("POLO-ESP"));

        assertThat(stock(producto)).isEqualTo(1);
    }

    @Test
    void descuentoPorcentualYMontoFijoSeAplicanAntesDelIgv() throws Exception {
        crearDescuentoVigente("QUINCE", "PORCENTAJE", "15.00");
        crearDescuentoVigente("DIEZ", "MONTO_FIJO", "10.00");
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "33.33", 20);

        alCarrito(cliente, producto, 3);

        get("/api/checkout/resumen?codigoDescuento=quince", cliente, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtotal").value(99.99))
                .andExpect(jsonPath("$.montoDescuento").value(15.00))
                .andExpect(jsonPath("$.total").value(84.99));
        assertThat(stock(producto)).isEqualTo(20);

        Map<String, Object> conPorcentaje = new HashMap<>(boleta(direccion, metodoPago));
        conPorcentaje.put("codigoDescuento", "quince");

        post("/api/checkout", cliente, null, conPorcentaje)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subtotal").value(99.99))
                .andExpect(jsonPath("$.montoDescuento").value(15.00))
                .andExpect(jsonPath("$.total").value(84.99))
                .andExpect(jsonPath("$.baseImponible").value(72.03))
                .andExpect(jsonPath("$.montoIgv").value(12.96))
                .andExpect(jsonPath("$.codigoDescuento").value("QUINCE"))
                .andExpect(jsonPath("$.tipoDescuento").value("PORCENTAJE"))
                .andExpect(jsonPath("$.valorDescuento").value(15.00));

        alCarrito(cliente, producto, 1);

        Map<String, Object> conMontoFijo = new HashMap<>(boleta(direccion, metodoPago));
        conMontoFijo.put("codigoDescuento", "DIEZ");

        post("/api/checkout", cliente, null, conMontoFijo)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.montoDescuento").value(10.00))
                .andExpect(jsonPath("$.total").value(23.33));
    }

    @Test
    void rechazaDescuentosInvalidosSinDejarRastro() throws Exception {
        crearDescuento("VENCIDO", "PORCENTAJE", "10.00",
                LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(1));
        crearDescuentoVigente("MUCHO", "MONTO_FIJO", "500.00");

        Long producto = crearProductoConStock(propietario, tienda, "Polo", "50.00", 5);
        alCarrito(cliente, producto, 1);

        for (String codigo : List.of("VENCIDO", "MUCHO")) {
            Map<String, Object> cuerpo = new HashMap<>(boleta(direccion, metodoPago));
            cuerpo.put("codigoDescuento", codigo);
            post("/api/checkout", cliente, null, cuerpo).andExpect(status().isConflict());
        }

        Map<String, Object> inexistente = new HashMap<>(boleta(direccion, metodoPago));
        inexistente.put("codigoDescuento", "NO-EXISTE");
        post("/api/checkout", cliente, null, inexistente).andExpect(status().isNotFound());

        assertThat(entero("SELECT count(*) FROM pedidos")).isZero();
        assertThat(stock(producto)).isEqualTo(5);

        post("/api/descuentos", propietario, tienda, Map.of(
                "codigo", "CERO", "tipo", "PORCENTAJE", "valor", "0.00",
                "fechaInicio", LocalDateTime.now().toString(),
                "fechaFin", LocalDateTime.now().plusDays(1).toString()
        )).andExpect(status().isBadRequest());
    }

    @Test
    void facturaExigeRucYRazonSocialYLosDatosSeReutilizan() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "59.00", 10);
        alCarrito(cliente, producto, 1);

        Map<String, Object> factura = new HashMap<>();
        factura.put("direccionId", direccion);
        factura.put("metodoPagoId", metodoPago);
        factura.put("tipoComprobante", "FACTURA");

        post("/api/checkout", cliente, null, factura).andExpect(status().isBadRequest());

        factura.put("numeroDocumento", "12345678");
        factura.put("nombreRazonSocial", "Comercial SAC");
        post("/api/checkout", cliente, null, factura).andExpect(status().isBadRequest());

        factura.put("numeroDocumento", "20123456789");
        factura.put("direccionFiscal", "Jr. Fiscal 1");
        post("/api/checkout", cliente, null, factura)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comprobante.tipo").value("FACTURA"))
                .andExpect(jsonPath("$.comprobante.numero").value(org.hamcrest.Matchers.startsWith("F001-")))
                .andExpect(jsonPath("$.comprobante.tipoDocumento").value("RUC"))
                .andExpect(jsonPath("$.comprobante.nombreRazonSocial").value("Comercial SAC"));

        // Los datos quedaron guardados para prellenar la siguiente compra.
        Number guardados = leer(get("/api/mi-cuenta/datos-facturacion", cliente, null)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].numeroDocumento").value("20123456789")), "$[0].id");

        alCarrito(cliente, producto, 1);

        // Un RUC guardado no sirve para una boleta.
        post("/api/checkout", cliente, null, Map.of(
                "direccionId", direccion,
                "metodoPagoId", metodoPago,
                "datosFacturacionId", guardados
        )).andExpect(status().isConflict());

        post("/api/checkout", cliente, null, Map.of(
                "direccionId", direccion,
                "metodoPagoId", metodoPago,
                "tipoComprobante", "FACTURA",
                "datosFacturacionId", guardados
        )).andExpect(status().isCreated())
                .andExpect(jsonPath("$.comprobante.numeroDocumento").value("20123456789"));

        // Usados en un pedido, ya no se pueden borrar.
        delete("/api/mi-cuenta/datos-facturacion/" + guardados, cliente, null)
                .andExpect(status().isConflict());
    }

    @Test
    void boletaExigeDniValidoYNombre() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "59.00", 10);
        alCarrito(cliente, producto, 1);

        post("/api/checkout", cliente, null, Map.of("direccionId", direccion, "metodoPagoId", metodoPago))
                .andExpect(status().isBadRequest());

        post("/api/checkout", cliente, null, Map.of(
                "direccionId", direccion,
                "metodoPagoId", metodoPago,
                "numeroDocumento", "123",
                "nombreRazonSocial", "Ana Pérez"
        )).andExpect(status().isBadRequest());

        assertThat(entero("SELECT count(*) FROM pedidos")).isZero();
    }

    @Test
    void siFallaUnaLineaNoQuedaPedidoNiStockDescontado() throws Exception {
        Long abundante = crearProductoConStock(propietario, tienda, "Abundante", "10.00", 10);
        Long escaso = crearProductoConStock(propietario, tienda, "Escaso", "10.00", 5);
        alCarrito(cliente, abundante, 2);
        alCarrito(cliente, escaso, 5);

        // El stock baja después de agregarlo al carrito.
        jdbc.update("UPDATE inventario SET cantidad = 1 WHERE producto_id = ?", escaso);

        comprar().andExpect(status().isConflict());

        assertThat(stock(abundante)).isEqualTo(10);
        assertThat(stock(escaso)).isEqualTo(1);
        assertThat(entero("SELECT count(*) FROM pedidos")).isZero();
        assertThat(entero("SELECT count(*) FROM elementos_pedido")).isZero();
        assertThat(entero("SELECT count(*) FROM transacciones")).isZero();
        assertThat(entero("SELECT count(*) FROM datos_facturacion")).isZero();
        assertThat(entero("SELECT count(*) FROM carritos WHERE estado = 'ACTIVO'")).isEqualTo(1);
    }

    @Test
    void dosComprasSimultaneasNoVendenLaUltimaUnidadDosVeces() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Última unidad", "10.00", 1);

        String otroCliente = registrarCliente("publicada", "luis@correo.pe");
        Long otraDireccion = crearDireccion(otroCliente);
        alCarrito(cliente, producto, 1);
        alCarrito(otroCliente, producto, 1);

        List<CompletableFuture<Integer>> compras = new ArrayList<>();
        compras.add(CompletableFuture.supplyAsync(() -> comprarEnParalelo(cliente, direccion)));
        compras.add(CompletableFuture.supplyAsync(() -> comprarEnParalelo(otroCliente, otraDireccion)));

        List<Integer> resultados = compras.stream().map(CompletableFuture::join).toList();

        assertThat(resultados).containsExactlyInAnyOrder(201, 409);
        assertThat(stock(producto)).isZero();
        assertThat(entero("SELECT count(*) FROM pedidos")).isEqualTo(1);
    }

    private int comprarEnParalelo(String token, Long direccionCliente) {
        try {
            return post("/api/checkout", token, null, boleta(direccionCliente, metodoPago))
                    .andReturn().getResponse().getStatus();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    void metodoDePagoInactivoSeRechaza() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "10.00", 5);
        alCarrito(cliente, producto, 1);
        delete("/api/gestion/metodos-pago/" + metodoPago, propietario, tienda).andExpect(status().isNoContent());

        comprar().andExpect(status().isNotFound());

        get("/api/pagos/metodos", cliente, null).andExpect(jsonPath("$", hasSize(0)));
        assertThat(entero("SELECT count(*) FROM metodos_pago WHERE id = ?", metodoPago)).isEqualTo(1);
    }

    @Test
    void elPagoEnDosPasosYaNoExiste() throws Exception {
        post("/api/pagos", cliente, null, Map.of("pedidoId", 1, "metodoPagoId", metodoPago))
                .andExpect(status().isNotFound());
    }

    @Test
    void elPropietarioGestionaLosEstadosYCancelarDevuelveElStock() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "10.00", 5);
        alCarrito(cliente, producto, 2);
        Number pedido = leer(comprar().andExpect(status().isCreated()), "$.id");
        String ruta = "/api/gestion/pedidos/" + pedido;

        get("/api/gestion/pedidos?estado=confirmado", propietario, tienda)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].clienteNombre").value("Cliente"));

        patch(ruta + "/estado", propietario, tienda, Map.of("estado", "ENTREGADO"))
                .andExpect(status().isConflict());
        patch(ruta + "/estado", propietario, tienda, Map.of("estado", "PREPARANDO"))
                .andExpect(status().isOk());

        patch(ruta + "/estado", propietario, tienda, Map.of("estado", "CANCELADO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADO"))
                .andExpect(jsonPath("$.comprobante.estado").value("ANULADO"))
                .andExpect(jsonPath("$.transaccion.estado").value("ANULADA"));

        assertThat(stock(producto)).isEqualTo(5);

        // Cancelar no borra el historial, y un pedido cancelado no se reabre.
        assertThat(entero("SELECT count(*) FROM pedidos WHERE id = ?", pedido)).isEqualTo(1);
        assertThat(entero("SELECT count(*) FROM transacciones WHERE pedido_id = ?", pedido)).isEqualTo(1);
        patch(ruta + "/estado", propietario, tienda, Map.of("estado", "CONFIRMADO"))
                .andExpect(status().isConflict());
    }

    @Test
    void laAnaliticaCuentaVentasYExcluyeCancelados() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "10.00", 10);

        alCarrito(cliente, producto, 2);
        comprar().andExpect(status().isCreated());

        alCarrito(cliente, producto, 3);
        Number cancelado = leer(comprar().andExpect(status().isCreated()), "$.id");
        patch("/api/gestion/pedidos/" + cancelado + "/estado", propietario, tienda, Map.of("estado", "CANCELADO"))
                .andExpect(status().isOk());

        get("/api/analitica/dashboard", propietario, tienda)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pedidosPagados").value(1))
                .andExpect(jsonPath("$.ventasTotales").value(20.00))
                .andExpect(jsonPath("$.productosVendidos").value(2))
                .andExpect(jsonPath("$.clientesCompradores").value(1));

        get("/api/analitica/ventas", propietario, tienda)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].montoVentas").value(20.00))
                .andExpect(jsonPath("$[0].productosVendidos").value(2));

        get("/api/analitica/productos-mas-vendidos", propietario, tienda)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombreProducto").value("Polo"))
                .andExpect(jsonPath("$[0].cantidadVendida").value(2));
    }

    @Test
    void sinSuscripcionVigenteNoHayComprasPeroSeConservaElHistorial() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "10.00", 10);
        alCarrito(cliente, producto, 1);
        Number pedido = leer(comprar().andExpect(status().isCreated()), "$.id");
        alCarrito(cliente, producto, 1);

        vencerSuscripcion(tienda);

        // Público y compras bloqueados.
        get("/api/publico/tiendas/publicada", null, null).andExpect(status().isNotFound());
        comprar().andExpect(status().isForbidden()).andExpect(jsonPath("$.codigo").value("TIENDA_NO_DISPONIBLE"));
        post("/api/carrito/productos", cliente, null, Map.of("productoId", producto, "cantidad", 1))
                .andExpect(status().isForbidden());
        post("/api/publico/tiendas/publicada/clientes/registro", null, null, Map.of(
                "nombre", "Nuevo", "correoElectronico", "nuevo@correo.pe", "contrasena", CLAVE
        )).andExpect(status().isNotFound());

        // El cliente inicia sesión y consulta lo ya comprado.
        post("/api/publico/tiendas/publicada/clientes/login", null, null, Map.of(
                "correoElectronico", "ana@correo.pe", "contrasena", CLAVE
        )).andExpect(status().isOk());
        get("/api/pedidos", cliente, null).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        get("/api/pedidos/" + pedido, cliente, null).andExpect(status().isOk());
        get("/api/pagos/transacciones", cliente, null).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));

        // El propietario sigue gestionando las ventas, pero no el catálogo.
        get("/api/gestion/pedidos", propietario, tienda).andExpect(jsonPath("$", hasSize(1)));
        patch("/api/gestion/pedidos/" + pedido + "/estado", propietario, tienda, Map.of("estado", "PREPARANDO"))
                .andExpect(status().isOk());
        get("/api/gestion/transacciones", propietario, tienda).andExpect(jsonPath("$", hasSize(1)));
        post("/api/gestion/metodos-pago", propietario, tienda, Map.of("nombre", "Plin", "tipo", "PLIN"))
                .andExpect(status().isForbidden());
    }

    @Test
    void elCheckoutNoAceptaImportesDelFrontend() throws Exception {
        Long producto = crearProductoConStock(propietario, tienda, "Polo", "50.00", 5);
        alCarrito(cliente, producto, 1);

        Map<String, Object> manipulado = new HashMap<>(boleta(direccion, metodoPago));
        manipulado.put("total", 1);
        manipulado.put("subtotal", 1);
        manipulado.put("precioUnitario", 1);

        post("/api/checkout", cliente, null, manipulado)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(50.00));
    }
}
