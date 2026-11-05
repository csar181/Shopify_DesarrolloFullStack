package com.shopcloud.integracion;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Dos propietarios con una tienda cada uno y un cliente con el mismo correo en ambas. */
class AislamientoIntegrationTest extends IntegracionBase {

    private static final String CORREO_COMUN = "ana@correo.pe";

    private String propietarioA;
    private String propietarioB;
    private Long tiendaA;
    private Long tiendaB;
    private Long productoA;
    private Long productoB;
    private Long metodoA;
    private Long metodoB;
    private String clienteA;
    private String clienteB;
    private Long direccionA;
    private Long direccionB;

    @BeforeEach
    void prepararDosTiendas() throws Exception {
        propietarioA = registrarPropietario("a@tienda.pe");
        propietarioB = registrarPropietario("b@tienda.pe");
        tiendaA = crearTiendaPublicada(propietarioA, "tienda-a");
        tiendaB = crearTiendaPublicada(propietarioB, "tienda-b");
        productoA = crearProductoConStock(propietarioA, tiendaA, "Producto A", "10.00", 10);
        productoB = crearProductoConStock(propietarioB, tiendaB, "Producto B", "20.00", 10);
        metodoA = crearMetodoPago(propietarioA, tiendaA, "Yape");
        metodoB = crearMetodoPago(propietarioB, tiendaB, "Yape");
        clienteA = registrarCliente("tienda-a", CORREO_COMUN);
        clienteB = registrarCliente("tienda-b", CORREO_COMUN);
        direccionA = crearDireccion(clienteA);
        direccionB = crearDireccion(clienteB);
    }

    @Test
    void elMismoCorreoTieneCuentasIndependientesPorTienda() throws Exception {
        assertThat(entero("SELECT count(*) FROM clientes WHERE correo_electronico = ?", CORREO_COMUN))
                .isEqualTo(2);

        // No se puede registrar dos veces en la misma tienda.
        post("/api/publico/tiendas/tienda-a/clientes/registro", null, null, Map.of(
                "nombre", "Ana", "correoElectronico", CORREO_COMUN, "contrasena", CLAVE
        )).andExpect(status().isConflict());

        // Cada token solo ve los datos de su tienda.
        get("/api/mi-cuenta/direcciones", clienteA, null).andExpect(jsonPath("$", hasSize(1)));

        // El login es por tienda: una cuenta de A no existe en una tercera tienda.
        Long tiendaC = crearTiendaPublicada(propietarioA, "tienda-c");
        assertThat(tiendaC).isNotNull();
        post("/api/publico/tiendas/tienda-c/clientes/login", null, null, Map.of(
                "correoElectronico", CORREO_COMUN, "contrasena", CLAVE
        )).andExpect(status().isUnauthorized());
    }

    @Test
    void elTokenDeClienteNoSirveEnOtraTienda() throws Exception {
        get("/api/carrito", clienteA, tiendaB).andExpect(status().isForbidden());
        get("/api/pedidos", clienteA, tiendaB).andExpect(status().isForbidden());
        post("/api/checkout", clienteA, tiendaB, Map.of("direccionId", direccionA, "metodoPagoId", metodoB))
                .andExpect(status().isForbidden());
    }

    @Test
    void unPropietarioNoAccedeAOtraTienda() throws Exception {
        get("/api/productos", propietarioA, tiendaB).andExpect(status().isForbidden());
        get("/api/clientes", propietarioA, tiendaB).andExpect(status().isForbidden());
        get("/api/gestion/pedidos", propietarioA, tiendaB).andExpect(status().isForbidden());
        get("/api/analitica/dashboard", propietarioA, tiendaB).andExpect(status().isForbidden());
        get("/api/tiendas/" + tiendaB, propietarioA, null).andExpect(status().isNotFound());
        post("/api/suscripciones/contratar", propietarioA, tiendaB, Map.of("planId", plan("Emprendedor")))
                .andExpect(status().isForbidden());

        // Con su propia tienda en la cabecera, un recurso de otra tampoco existe.
        get("/api/productos/" + productoB, propietarioA, tiendaA).andExpect(status().isNotFound());
        put("/api/productos/" + productoB, propietarioA, tiendaA, Map.of("nombre", "X", "precio", "1.00"))
                .andExpect(status().isNotFound());
        assertThat(entero("SELECT count(*) FROM productos WHERE id = ? AND nombre = 'Producto B'", productoB))
                .isEqualTo(1);
    }

    @Test
    void lasRutasSeparanPropietariosYClientes() throws Exception {
        get("/api/productos", clienteA, tiendaA).andExpect(status().isForbidden());
        get("/api/gestion/pedidos", clienteA, tiendaA).andExpect(status().isForbidden());
        get("/api/tiendas/mis-tiendas", clienteA, null).andExpect(status().isForbidden());
        get("/api/auth/me", clienteA, null).andExpect(status().isForbidden());
        get("/api/usuarios/perfil", clienteA, null).andExpect(status().isForbidden());

        get("/api/carrito", propietarioA, tiendaA).andExpect(status().isForbidden());
        get("/api/pedidos", propietarioA, tiendaA).andExpect(status().isForbidden());

        get("/api/productos", propietarioA, null).andExpect(status().isBadRequest());
        get("/api/productos", propietarioA, null)
                .andExpect(jsonPath("$.detail").value("El encabezado X-Tenant-ID es obligatorio"));
    }

    @Test
    void noSePuedeAgregarAlCarritoUnProductoDeOtraTienda() throws Exception {
        post("/api/carrito/productos", clienteA, null, Map.of("productoId", productoB, "cantidad", 1))
                .andExpect(status().isNotFound());

        post("/api/carrito/sincronizar", clienteA, null, Map.of("elementos", java.util.List.of(
                Map.of("productoId", productoB, "cantidad", 1)
        ))).andExpect(jsonPath("$.elementos", hasSize(0)));
    }

    @Test
    void noSePuedeUsarUnaCategoriaDeOtraTienda() throws Exception {
        Long categoriaB = id(post("/api/categorias", propietarioB, tiendaB, Map.of("nombre", "Polos"))
                .andExpect(status().isCreated()));

        post("/api/productos", propietarioA, tiendaA, Map.of(
                "nombre", "Intruso", "precio", "1.00", "categoriaId", categoriaB
        )).andExpect(status().isNotFound());

        get("/api/categorias/" + categoriaB, propietarioA, tiendaA).andExpect(status().isNotFound());
    }

    @Test
    void noSeUsanEnElCheckoutDatosDeOtraTienda() throws Exception {
        post("/api/descuentos", propietarioB, tiendaB, Map.of(
                "codigo", "SOLO-B", "tipo", "PORCENTAJE", "valor", "50.00",
                "fechaInicio", LocalDateTime.now().minusDays(1).toString(),
                "fechaFin", LocalDateTime.now().plusDays(1).toString()
        )).andExpect(status().isCreated());

        alCarrito(clienteA, productoA, 1);

        // Descuento de otra tienda.
        Map<String, Object> conDescuentoAjeno = new HashMap<>(boleta(direccionA, metodoA));
        conDescuentoAjeno.put("codigoDescuento", "SOLO-B");
        post("/api/checkout", clienteA, null, conDescuentoAjeno).andExpect(status().isNotFound());

        // Método de pago de otra tienda.
        post("/api/checkout", clienteA, null, boleta(direccionA, metodoB)).andExpect(status().isNotFound());

        // Dirección de otra cuenta.
        post("/api/checkout", clienteA, null, boleta(direccionB, metodoA)).andExpect(status().isNotFound());

        assertThat(entero("SELECT count(*) FROM pedidos")).isZero();
        post("/api/checkout", clienteA, null, boleta(direccionA, metodoA)).andExpect(status().isCreated());
    }

    @Test
    void pedidosYTransaccionesSoloSeVenDentroDeSuTienda() throws Exception {
        alCarrito(clienteA, productoA, 1);
        Number pedidoA = leer(post("/api/checkout", clienteA, null, boleta(direccionA, metodoA))
                .andExpect(status().isCreated()), "$.id");
        Number transaccionA = leer(get("/api/pagos/transacciones", clienteA, null), "$[0].id");

        get("/api/pedidos", clienteB, null).andExpect(jsonPath("$", hasSize(0)));
        get("/api/pedidos/" + pedidoA, clienteB, null).andExpect(status().isNotFound());
        get("/api/pagos/transacciones", clienteB, null).andExpect(jsonPath("$", hasSize(0)));
        get("/api/pagos/transacciones/" + transaccionA, clienteB, null).andExpect(status().isNotFound());

        get("/api/gestion/pedidos", propietarioB, tiendaB).andExpect(jsonPath("$", hasSize(0)));
        get("/api/gestion/pedidos/" + pedidoA, propietarioB, tiendaB).andExpect(status().isNotFound());
        patch("/api/gestion/pedidos/" + pedidoA + "/estado", propietarioB, tiendaB, Map.of("estado", "CANCELADO"))
                .andExpect(status().isNotFound());
        get("/api/gestion/transacciones/" + transaccionA, propietarioB, tiendaB).andExpect(status().isNotFound());

        get("/api/gestion/pedidos/" + pedidoA, propietarioA, tiendaA).andExpect(status().isOk());
    }

    @Test
    void elCatalogoPublicoSoloMuestraProductosDeSuTienda() throws Exception {
        get("/api/publico/tiendas/tienda-a/productos", null, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Producto A"));

        get("/api/publico/tiendas/tienda-a/productos/" + productoB, null, null)
                .andExpect(status().isNotFound());
    }

    @Test
    void lasRestriccionesDePostgresqlRespaldanElAislamiento() throws Exception {
        Long clienteDeA = jdbc.queryForObject(
                "SELECT id FROM clientes WHERE tienda_id = ?", Long.class, tiendaA);

        // Aunque un error del backend lo intentara, las claves compuestas lo impiden.
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO carritos (tienda_id, cliente_id) VALUES (?, ?)
                """, tiendaB, clienteDeA)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }
}
