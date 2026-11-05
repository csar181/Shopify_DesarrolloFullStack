package com.shopcloud.integracion;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Recorre la API real (seguridad, interceptor, CHECK de PostgreSQL) en el esquema it. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
abstract class IntegracionBase {

    protected static final String CLAVE = "contrasena-segura";

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcTemplate jdbc;

    @BeforeEach
    void limpiarEsquemaDePruebas() {
        String ubicacion = jdbc.queryForObject(
                "SELECT current_database() || '/' || current_schema()", String.class);

        if (!"shopcloud_test/it".equals(ubicacion)) {
            throw new IllegalStateException("Las pruebas solo pueden limpiar shopcloud_test/it: " + ubicacion);
        }
        // planes no depende de estas tablas, así que sus datos iniciales se conservan.
        jdbc.execute("TRUNCATE usuarios, roles RESTART IDENTITY CASCADE");
    }

    protected ResultActions pedir(HttpMethod metodo, String ruta, String token, Long tienda, Object cuerpo)
            throws Exception {
        MockHttpServletRequestBuilder peticion = MockMvcRequestBuilders.request(metodo, ruta);

        if (token != null) {
            peticion.header("Authorization", "Bearer " + token);
        }
        if (tienda != null) {
            peticion.header("X-Tenant-ID", tienda);
        }
        if (cuerpo != null) {
            peticion.contentType(MediaType.APPLICATION_JSON).content(JSON.writeValueAsString(cuerpo));
        }
        return mvc.perform(peticion);
    }

    protected ResultActions get(String ruta, String token, Long tienda) throws Exception {
        return pedir(HttpMethod.GET, ruta, token, tienda, null);
    }

    protected ResultActions post(String ruta, String token, Long tienda, Object cuerpo) throws Exception {
        return pedir(HttpMethod.POST, ruta, token, tienda, cuerpo);
    }

    protected ResultActions put(String ruta, String token, Long tienda, Object cuerpo) throws Exception {
        return pedir(HttpMethod.PUT, ruta, token, tienda, cuerpo);
    }

    protected ResultActions patch(String ruta, String token, Long tienda, Object cuerpo) throws Exception {
        return pedir(HttpMethod.PATCH, ruta, token, tienda, cuerpo);
    }

    protected ResultActions delete(String ruta, String token, Long tienda) throws Exception {
        return pedir(HttpMethod.DELETE, ruta, token, tienda, null);
    }

    protected <T> T leer(ResultActions resultado, String ruta) throws Exception {
        return JsonPath.read(resultado.andReturn().getResponse().getContentAsString(), ruta);
    }

    protected Long id(ResultActions resultado) throws Exception {
        Number id = leer(resultado, "$.id");
        return id.longValue();
    }

    protected Long plan(String nombre) {
        return jdbc.queryForObject("SELECT id FROM planes WHERE nombre = ?", Long.class, nombre);
    }

    protected String registrarPropietario(String correo) throws Exception {
        return leer(post("/api/auth/registro", null, null, Map.of(
                "nombre", "Propietario",
                "correoElectronico", correo,
                "contrasena", CLAVE
        )).andExpect(status().isCreated()), "$.token");
    }

    protected Long crearTienda(String token, String slug, String planNombre) throws Exception {
        return id(post("/api/tiendas", token, null, Map.of(
                "nombre", "Tienda " + slug,
                "slug", slug,
                "planId", plan(planNombre)
        )).andExpect(status().isCreated()));
    }

    protected void contratar(String token, Long tienda, String planNombre) throws Exception {
        post("/api/suscripciones/contratar", token, tienda, Map.of("planId", plan(planNombre)))
                .andExpect(status().isCreated());
    }

    protected Long crearTiendaPublicada(String token, String slug) throws Exception {
        Long tienda = crearTienda(token, slug, "Profesional");
        contratar(token, tienda, "Profesional");
        return tienda;
    }

    protected Long crearProducto(String token, Long tienda, String nombre, String precio) throws Exception {
        return id(post("/api/productos", token, tienda, Map.of(
                "nombre", nombre,
                "precio", precio
        )).andExpect(status().isCreated()));
    }

    protected Long crearStock(String token, Long tienda, Long producto, Long variante, int cantidad)
            throws Exception {
        java.util.Map<String, Object> cuerpo = new java.util.HashMap<>();
        cuerpo.put("productoId", producto);
        cuerpo.put("varianteId", variante);
        cuerpo.put("cantidad", cantidad);
        cuerpo.put("cantidadMinima", 0);
        return id(post("/api/inventario", token, tienda, cuerpo).andExpect(status().isCreated()));
    }

    protected Long crearProductoConStock(String token, Long tienda, String nombre, String precio, int cantidad)
            throws Exception {
        Long producto = crearProducto(token, tienda, nombre, precio);
        crearStock(token, tienda, producto, null, cantidad);
        return producto;
    }

    protected Long crearMetodoPago(String token, Long tienda, String nombre) throws Exception {
        return id(post("/api/gestion/metodos-pago", token, tienda, Map.of(
                "nombre", nombre,
                "tipo", "YAPE",
                "instrucciones", "Pague al número indicado"
        )).andExpect(status().isCreated()));
    }

    protected String registrarCliente(String slug, String correo) throws Exception {
        return leer(post("/api/publico/tiendas/" + slug + "/clientes/registro", null, null, Map.of(
                "nombre", "Cliente",
                "correoElectronico", correo,
                "contrasena", CLAVE
        )).andExpect(status().isCreated()), "$.token");
    }

    protected Long crearDireccion(String tokenCliente) throws Exception {
        return id(post("/api/mi-cuenta/direcciones", tokenCliente, null, Map.of(
                "lineaDireccion", "Av. Arequipa 123",
                "ciudad", "Lima",
                "distrito", "Lince"
        )).andExpect(status().isCreated()));
    }

    protected void alCarrito(String tokenCliente, Long producto, int cantidad) throws Exception {
        post("/api/carrito/productos", tokenCliente, null, Map.of(
                "productoId", producto,
                "cantidad", cantidad
        )).andExpect(status().isOk());
    }

    protected Map<String, Object> boleta(Long direccion, Long metodoPago) {
        return Map.of(
                "direccionId", direccion,
                "metodoPagoId", metodoPago,
                "numeroDocumento", "12345678",
                "nombreRazonSocial", "Ana Pérez"
        );
    }

    /** Simula el paso del tiempo: la suscripción activa terminó hace un minuto. */
    protected void vencerSuscripcion(Long tienda) {
        jdbc.update("""
                UPDATE suscripciones
                SET fecha_inicio = LEAST(fecha_inicio, now() - INTERVAL '40 days'),
                    fecha_fin = now() - INTERVAL '1 minute'
                WHERE tienda_id = ? AND estado = 'ACTIVA'
                """, tienda);
    }

    protected int entero(String sql, Object... parametros) {
        return jdbc.queryForObject(sql, Integer.class, parametros);
    }
}
