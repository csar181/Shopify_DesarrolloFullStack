package com.shopcloud.integracion;

import com.shopcloud.plan.service.VencimientoSuscripcionesJob;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SuscripcionesIntegrationTest extends IntegracionBase {

    @Autowired
    private VencimientoSuscripcionesJob job;

    @Test
    void propietarioSeRegistraEIniciaSesion() throws Exception {
        registrarPropietario("duena@tienda.pe");

        post("/api/auth/login", null, null, Map.of(
                "correoElectronico", "DUENA@tienda.pe",
                "contrasena", CLAVE
        )).andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());

        post("/api/auth/login", null, null, Map.of(
                "correoElectronico", "duena@tienda.pe",
                "contrasena", "incorrecta"
        )).andExpect(status().isUnauthorized());
    }

    @Test
    void unCuerpoQueNoEsJsonRespondeTipoNoSoportado() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/auth/registro")
                        .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                        .content("hola"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.detail").value("El cuerpo de la petición debe enviarse como JSON"));
    }

    @Test
    void lasRutasPrivadasExigenSesion() throws Exception {
        get("/api/tiendas/mis-tiendas", null, null).andExpect(status().isUnauthorized());
        get("/api/tiendas/mis-tiendas", "token-invalido", null).andExpect(status().isUnauthorized());
    }

    @Test
    void unPropietarioTieneVariasTiendasConPlanesYPruebasIndependientes() throws Exception {
        String token = registrarPropietario("varias@tienda.pe");
        Long ropa = crearTienda(token, "ropa", "Emprendedor");
        Long tecnologia = crearTienda(token, "tecnologia", "Profesional");

        get("/api/tiendas/mis-tiendas", token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        get("/api/tiendas/" + ropa, token, null)
                .andExpect(jsonPath("$.planNombre").value("Emprendedor"));
        get("/api/tiendas/" + tecnologia, token, null)
                .andExpect(jsonPath("$.planNombre").value("Profesional"));

        contratar(token, ropa, "Emprendedor");

        get("/api/tiendas/" + ropa, token, null).andExpect(jsonPath("$.publicada").value(true));
        get("/api/tiendas/" + tecnologia, token, null).andExpect(jsonPath("$.publicada").value(false));
    }

    @Test
    void laPruebaDuraExactamenteSieteDiasYNoPublicaLaTienda() throws Exception {
        String token = registrarPropietario("prueba@tienda.pe");
        Long tienda = crearTienda(token, "en-prueba", "Crecimiento");

        assertThat(entero("""
                SELECT count(*) FROM suscripciones
                WHERE tienda_id = ? AND tipo = 'PRUEBA' AND estado = 'ACTIVA'
                  AND monto_pagado IS NULL AND pagado_en IS NULL
                  AND fecha_fin = fecha_inicio + INTERVAL '7 days'
                """, tienda)).isEqualTo(1);

        get("/api/tiendas/" + tienda, token, null)
                .andExpect(jsonPath("$.administrable").value(true))
                .andExpect(jsonPath("$.publicada").value(false))
                .andExpect(jsonPath("$.suscripcionTipo").value("PRUEBA"));

        // Administra su tienda, pero el público no la ve ni puede registrarse.
        crearProductoConStock(token, tienda, "Polo", "50.00", 5);
        crearMetodoPago(token, tienda, "Yape");

        get("/api/publico/tiendas/en-prueba", null, null)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("TIENDA_NO_DISPONIBLE"));
        get("/api/publico/tiendas/en-prueba/productos", null, null).andExpect(status().isNotFound());
        post("/api/publico/tiendas/en-prueba/clientes/registro", null, null, Map.of(
                "nombre", "Cliente",
                "correoElectronico", "c@c.pe",
                "contrasena", CLAVE
        )).andExpect(status().isNotFound());
    }

    @Test
    void laVigenciaTerminaAlLlegarAFechaFin() throws Exception {
        String token = registrarPropietario("limite@tienda.pe");
        Long tienda = crearTienda(token, "limite", "Emprendedor");

        jdbc.update("UPDATE suscripciones SET fecha_inicio = now() - INTERVAL '6 days 23 hours 59 minutes', "
                + "fecha_fin = now() + INTERVAL '1 minute' WHERE tienda_id = ?", tienda);
        crearProducto(token, tienda, "Aún en plazo", "10.00");

        jdbc.update("UPDATE suscripciones SET fecha_fin = now() WHERE tienda_id = ?", tienda);
        post("/api/productos", token, tienda, Map.of("nombre", "Fuera de plazo", "precio", "10.00"))
                .andExpect(status().isForbidden());
    }

    @Test
    void alVencerLaPruebaElPanelQuedaEnSoloLecturaYPuedeContratarDespues() throws Exception {
        String token = registrarPropietario("vencida@tienda.pe");
        Long tienda = crearTienda(token, "vencida", "Emprendedor");
        Long producto = crearProducto(token, tienda, "Polo", "50.00");
        vencerSuscripcion(tienda);

        get("/api/productos", token, tienda).andExpect(status().isOk());
        get("/api/tiendas/" + tienda, token, null)
                .andExpect(jsonPath("$.administrable").value(false))
                .andExpect(jsonPath("$.publicada").value(false));

        post("/api/productos", token, tienda, Map.of("nombre", "Otro", "precio", "10.00"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("SUSCRIPCION_REQUERIDA"));
        delete("/api/productos/" + producto, token, tienda).andExpect(status().isForbidden());
        put("/api/tiendas/" + tienda, token, null, Map.of("nombre", "Nuevo nombre"))
                .andExpect(status().isForbidden());

        contratar(token, tienda, "Crecimiento");

        get("/api/tiendas/" + tienda, token, null)
                .andExpect(jsonPath("$.publicada").value(true))
                .andExpect(jsonPath("$.suscripcionTipo").value("PAGADA"))
                .andExpect(jsonPath("$.planNombre").value("Crecimiento"));
        get("/api/publico/tiendas/vencida", null, null).andExpect(status().isOk());
        crearProducto(token, tienda, "Otro", "10.00");
    }

    @Test
    void contratarDuranteLaPruebaPublicaLaTiendaYConservaLaPruebaEnElHistorial() throws Exception {
        String token = registrarPropietario("contrata@tienda.pe");
        Long tienda = crearTienda(token, "contrata", "Crecimiento");

        contratar(token, tienda, "Crecimiento");

        get("/api/suscripciones", token, tienda)
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].tipo").value("PAGADA"))
                .andExpect(jsonPath("$[0].estado").value("ACTIVA"))
                .andExpect(jsonPath("$[0].montoPagado").value(59.00))
                .andExpect(jsonPath("$[1].tipo").value("PRUEBA"))
                .andExpect(jsonPath("$[1].estado").value("CANCELADA"));
    }

    @Test
    void renovarConservaLosDiasRestantesYElHistorialDePagos() throws Exception {
        String token = registrarPropietario("renueva@tienda.pe");
        Long tienda = crearTienda(token, "renueva", "Crecimiento");
        contratar(token, tienda, "Crecimiento");

        // Quedan 10 días del periodo pagado, comprado a un precio anterior.
        jdbc.update("""
                UPDATE suscripciones
                SET fecha_inicio = now() - INTERVAL '20 days',
                    fecha_fin = date_trunc('second', now() + INTERVAL '10 days'),
                    monto_pagado = 49.00,
                    pagado_en = now() - INTERVAL '20 days'
                WHERE tienda_id = ? AND estado = 'ACTIVA'
                """, tienda);
        LocalDateTime finAnterior = jdbc.queryForObject(
                "SELECT fecha_fin FROM suscripciones WHERE tienda_id = ? AND estado = 'ACTIVA'",
                LocalDateTime.class, tienda);

        contratar(token, tienda, "Crecimiento");

        assertThat(jdbc.queryForObject(
                "SELECT fecha_fin FROM suscripciones WHERE tienda_id = ? AND estado = 'ACTIVA'",
                LocalDateTime.class, tienda)).isEqualTo(finAnterior.plusMonths(1));

        assertThat(entero("SELECT count(*) FROM suscripciones WHERE tienda_id = ? AND estado = 'ACTIVA'", tienda))
                .isEqualTo(1);
        // El pago anterior sigue intacto, y el nuevo tiene su propia fila.
        assertThat(entero("SELECT count(*) FROM suscripciones WHERE tienda_id = ? AND tipo = 'PAGADA' "
                + "AND estado = 'CANCELADA' AND monto_pagado = 49.00 AND pagado_en IS NOT NULL", tienda))
                .isEqualTo(1);
        assertThat(entero("SELECT count(*) FROM suscripciones WHERE tienda_id = ? AND tipo = 'PAGADA' "
                + "AND estado = 'ACTIVA' AND monto_pagado = 59.00", tienda)).isEqualTo(1);
    }

    @Test
    void cambiarDePlanSoloSePermiteEnLaPruebaOAlVencer() throws Exception {
        String token = registrarPropietario("cambio@tienda.pe");
        Long tienda = crearTienda(token, "cambio", "Emprendedor");
        LocalDateTime finPrueba = jdbc.queryForObject(
                "SELECT fecha_fin FROM suscripciones WHERE tienda_id = ?", LocalDateTime.class, tienda);

        put("/api/suscripciones/cambiar-plan", token, tienda, Map.of("planId", plan("Profesional")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planNombre").value("Profesional"))
                .andExpect(jsonPath("$.tipo").value("PRUEBA"));

        // Cambiar de plan no reinicia los siete días.
        assertThat(jdbc.queryForObject("SELECT fecha_fin FROM suscripciones WHERE tienda_id = ?",
                LocalDateTime.class, tienda)).isEqualTo(finPrueba);

        contratar(token, tienda, "Profesional");

        put("/api/suscripciones/cambiar-plan", token, tienda, Map.of("planId", plan("Emprendedor")))
                .andExpect(status().isConflict());
        post("/api/suscripciones/contratar", token, tienda, Map.of("planId", plan("Emprendedor")))
                .andExpect(status().isConflict());

        vencerSuscripcion(tienda);
        contratar(token, tienda, "Emprendedor");
        get("/api/suscripciones/activa", token, tienda)
                .andExpect(jsonPath("$.planNombre").value("Emprendedor"));
    }

    @Test
    void unaTiendaNoPuedeTenerDosPruebasNiPagosSinMonto() throws Exception {
        String token = registrarPropietario("indice@tienda.pe");
        Long tienda = crearTienda(token, "indice", "Emprendedor");
        contratar(token, tienda, "Emprendedor");
        vencerSuscripcion(tienda);

        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO suscripciones (tienda_id, plan_id, estado, tipo, fecha_inicio, fecha_fin)
                VALUES (?, ?, 'VENCIDA', 'PRUEBA', now(), now())
                """, tienda, plan("Emprendedor"))).isInstanceOf(DataIntegrityViolationException.class);

        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO suscripciones (tienda_id, plan_id, estado, tipo, fecha_inicio, fecha_fin)
                VALUES (?, ?, 'VENCIDA', 'PAGADA', now(), now())
                """, tienda, plan("Emprendedor"))).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void elProcesoProgramadoMarcaVencidasSinAfectarLasVigentes() throws Exception {
        String token = registrarPropietario("job@tienda.pe");
        Long vencida = crearTienda(token, "job-vencida", "Emprendedor");
        Long vigente = crearTienda(token, "job-vigente", "Emprendedor");
        vencerSuscripcion(vencida);

        job.marcarVencidas();

        assertThat(entero("SELECT count(*) FROM suscripciones WHERE tienda_id = ? AND estado = 'VENCIDA'", vencida))
                .isEqualTo(1);
        assertThat(entero("SELECT count(*) FROM suscripciones WHERE tienda_id = ? AND estado = 'ACTIVA'", vigente))
                .isEqualTo(1);

        // Contratar tras la marca del proceso también funciona.
        contratar(token, vencida, "Emprendedor");
        get("/api/tiendas/" + vencida, token, null).andExpect(jsonPath("$.publicada").value(true));
    }

    @Test
    void desactivarLaTiendaLaDespublicaHastaReactivarla() throws Exception {
        String token = registrarPropietario("pausa@tienda.pe");
        Long tienda = crearTiendaPublicada(token, "pausa");

        delete("/api/tiendas/" + tienda, token, null).andExpect(status().isNoContent());

        get("/api/publico/tiendas/pausa", null, null).andExpect(status().isNotFound());
        get("/api/productos", token, tienda).andExpect(status().isOk());
        post("/api/productos", token, tienda, Map.of("nombre", "Polo", "precio", "10.00"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("TIENDA_DESACTIVADA"));

        patch("/api/tiendas/" + tienda + "/activar", token, null, null).andExpect(status().isOk());
        get("/api/publico/tiendas/pausa", null, null).andExpect(status().isOk());
    }

    @Test
    void laApiQuedaDocumentadaEnOpenApi() throws Exception {
        get("/v3/api-docs", null, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/checkout'].post").exists())
                .andExpect(jsonPath("$.paths['/api/suscripciones/contratar'].post.parameters[0].name")
                        .value("X-Tenant-ID"))
                .andExpect(jsonPath("$.paths['/api/publico/tiendas/{slug}/clientes/login'].post").exists())
                .andExpect(jsonPath("$.paths['/api/gestion/pedidos/{id}/estado'].patch").exists());
    }

    @Test
    void lasPlantillasDePlanSeExponenConSusLimitesYFuncionalidades() throws Exception {
        get("/api/planes", null, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[?(@.nombre == 'Emprendedor')].precio").value(29.00))
                .andExpect(jsonPath("$[?(@.nombre == 'Emprendedor')].maxProductos").value(30))
                .andExpect(jsonPath("$[?(@.nombre == 'Emprendedor')].maxCategorias").value(5))
                .andExpect(jsonPath("$[?(@.nombre == 'Emprendedor')].maxImagenesProducto").value(3))
                .andExpect(jsonPath("$[?(@.nombre == 'Emprendedor')].maxUsuarios").value(1))
                .andExpect(jsonPath("$[?(@.nombre == 'Emprendedor')].funcionalidades.estadisticas")
                        .value("BASICAS"));
    }
}
