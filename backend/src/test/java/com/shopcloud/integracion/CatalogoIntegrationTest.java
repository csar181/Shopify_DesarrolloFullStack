package com.shopcloud.integracion;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CatalogoIntegrationTest extends IntegracionBase {

    @Test
    void elPlanLimitaLasCategoriasContandoSoloLasActivas() throws Exception {
        String token = registrarPropietario("cat@tienda.pe");
        Long tienda = crearTienda(token, "cat", "Emprendedor");

        Long primera = null;
        for (int i = 1; i <= 5; i++) {
            Long categoria = id(post("/api/categorias", token, tienda, Map.of("nombre", "Categoría " + i))
                    .andExpect(status().isCreated()));
            primera = primera == null ? categoria : primera;
        }

        post("/api/categorias", token, tienda, Map.of("nombre", "Sexta"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("LIMITE_PLAN"));

        delete("/api/categorias/" + primera, token, tienda).andExpect(status().isNoContent());
        Long sexta = id(post("/api/categorias", token, tienda, Map.of("nombre", "Sexta"))
                .andExpect(status().isCreated()));

        // Reactivar también respeta el límite.
        patch("/api/categorias/" + primera + "/activar", token, tienda, null)
                .andExpect(status().isConflict());
        delete("/api/categorias/" + sexta, token, tienda).andExpect(status().isNoContent());
        patch("/api/categorias/" + primera + "/activar", token, tienda, null).andExpect(status().isOk());
    }

    @Test
    void elPlanLimitaLosProductos() throws Exception {
        String token = registrarPropietario("prod@tienda.pe");
        Long tienda = crearTienda(token, "prod", "Emprendedor");

        jdbc.update("""
                INSERT INTO productos (tienda_id, nombre, precio)
                SELECT ?, 'Producto ' || n, 10 FROM generate_series(1, 30) AS n
                """, tienda);

        post("/api/productos", token, tienda, Map.of("nombre", "Número 31", "precio", "10.00"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("LIMITE_PLAN"));

        // Con un plan mayor el mismo catálogo tiene cupo.
        put("/api/suscripciones/cambiar-plan", token, tienda, Map.of("planId", plan("Crecimiento")))
                .andExpect(status().isOk());
        crearProducto(token, tienda, "Número 31", "10.00");
    }

    @Test
    void bajarDePlanNoBorraNadaPeroImpideCrearMas() throws Exception {
        String token = registrarPropietario("baja@tienda.pe");
        Long tienda = crearTienda(token, "baja", "Crecimiento");

        for (int i = 1; i <= 6; i++) {
            post("/api/categorias", token, tienda, Map.of("nombre", "Categoría " + i))
                    .andExpect(status().isCreated());
        }

        put("/api/suscripciones/cambiar-plan", token, tienda, Map.of("planId", plan("Emprendedor")))
                .andExpect(status().isOk());

        get("/api/categorias", token, tienda).andExpect(jsonPath("$", hasSize(6)));
        post("/api/categorias", token, tienda, Map.of("nombre", "Séptima"))
                .andExpect(status().isConflict());
    }

    @Test
    void elPlanLimitaLasImagenesYSoloHayUnaPrincipal() throws Exception {
        String token = registrarPropietario("img@tienda.pe");
        Long tienda = crearTienda(token, "img", "Emprendedor");
        Long producto = crearProducto(token, tienda, "Polo", "50.00");
        String ruta = "/api/productos/" + producto + "/imagenes";

        for (int i = 1; i <= 3; i++) {
            post(ruta, token, tienda, Map.of("urlImagen", "https://img/" + i, "esPrincipal", true))
                    .andExpect(status().isCreated());
        }

        post(ruta, token, tienda, Map.of("urlImagen", "https://img/4"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("LIMITE_PLAN"));

        assertThat(entero("SELECT count(*) FROM imagenes_producto WHERE producto_id = ? AND es_principal", producto))
                .isEqualTo(1);
    }

    @Test
    void lasEstadisticasDependenDelNivelDelPlan() throws Exception {
        String token = registrarPropietario("stats@tienda.pe");
        Long basico = crearTienda(token, "stats-basico", "Emprendedor");
        Long medio = crearTienda(token, "stats-medio", "Crecimiento");
        Long alto = crearTienda(token, "stats-alto", "Profesional");

        get("/api/analitica/dashboard", token, basico).andExpect(status().isOk());
        get("/api/analitica/ventas", token, basico)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("FUNCIONALIDAD_NO_INCLUIDA"));

        get("/api/analitica/ventas", token, medio).andExpect(status().isOk());
        get("/api/analitica/productos-mas-vendidos", token, medio).andExpect(status().isForbidden());

        get("/api/analitica/productos-mas-vendidos", token, alto).andExpect(status().isOk());

        // Siguen disponibles en solo lectura, según el último plan.
        vencerSuscripcion(alto);
        get("/api/analitica/productos-mas-vendidos", token, alto).andExpect(status().isOk());
    }

    @Test
    void varianteConPrecioPropioOPrecioDelProducto() throws Exception {
        String token = registrarPropietario("var@tienda.pe");
        Long tienda = crearTiendaPublicada(token, "var");
        Long producto = crearProducto(token, tienda, "Polo", "50.00");
        String ruta = "/api/productos/" + producto + "/variantes";

        Long talla = id(post(ruta, token, tienda, Map.of("nombre", "Talla S")).andExpect(status().isCreated()));
        Long especial = id(post(ruta, token, tienda, Map.of("nombre", "Edición especial", "precio", "75.00"))
                .andExpect(status().isCreated()));
        crearStock(token, tienda, producto, talla, 4);
        crearStock(token, tienda, producto, especial, 2);

        get("/api/publico/tiendas/var/productos/" + producto, null, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(6))
                .andExpect(jsonPath("$.variantes[?(@.nombre == 'Talla S')].precio").value(50.00))
                .andExpect(jsonPath("$.variantes[?(@.nombre == 'Talla S')].stock").value(4))
                .andExpect(jsonPath("$.variantes[?(@.nombre == 'Edición especial')].precio").value(75.00));
    }

    @Test
    void unProductoNoMezclaInventarioGeneralYPorVariantes() throws Exception {
        String token = registrarPropietario("inv@tienda.pe");
        Long tienda = crearTienda(token, "inv", "Profesional");

        // Con inventario general no se puede pasar a variantes hasta eliminarlo.
        Long general = crearProducto(token, tienda, "General", "10.00");
        Long stockGeneral = crearStock(token, tienda, general, null, 5);
        post("/api/productos/" + general + "/variantes", token, tienda, Map.of("nombre", "Talla M"))
                .andExpect(status().isConflict());

        delete("/api/inventario/" + stockGeneral, token, tienda).andExpect(status().isConflict());
        put("/api/inventario/" + stockGeneral, token, tienda, Map.of("cantidad", 0, "cantidadMinima", 0))
                .andExpect(status().isOk());
        delete("/api/inventario/" + stockGeneral, token, tienda).andExpect(status().isNoContent());
        post("/api/productos/" + general + "/variantes", token, tienda, Map.of("nombre", "Talla M"))
                .andExpect(status().isCreated());

        // Con inventario por variantes no se admite el general.
        Long porVariantes = crearProducto(token, tienda, "Por variantes", "10.00");
        Long variante = id(post("/api/productos/" + porVariantes + "/variantes", token, tienda,
                Map.of("nombre", "Talla L")).andExpect(status().isCreated()));
        crearStock(token, tienda, porVariantes, variante, 3);

        post("/api/inventario", token, tienda, Map.of(
                "productoId", porVariantes, "cantidad", 1, "cantidadMinima", 0
        )).andExpect(status().isConflict());

        // Tampoco dos registros para la misma variante.
        post("/api/inventario", token, tienda, Map.of(
                "productoId", porVariantes, "varianteId", variante, "cantidad", 1, "cantidadMinima", 0
        )).andExpect(status().isConflict());
    }

    @Test
    void nombreDeCategoriaDuplicadoAlActualizarEsUnConflictoControlado() throws Exception {
        String token = registrarPropietario("dup@tienda.pe");
        Long tienda = crearTienda(token, "dup", "Profesional");
        post("/api/categorias", token, tienda, Map.of("nombre", "Polos")).andExpect(status().isCreated());
        Long otra = id(post("/api/categorias", token, tienda, Map.of("nombre", "Gorras"))
                .andExpect(status().isCreated()));

        put("/api/categorias/" + otra, token, tienda, Map.of("nombre", "Polos"))
                .andExpect(status().isConflict());
    }

    @Test
    void losListadosIncluyenLosDesactivadosSoloSiSeSolicitan() throws Exception {
        String token = registrarPropietario("inactivos@tienda.pe");
        Long tienda = crearTienda(token, "inactivos", "Emprendedor");
        Long categoria = id(post("/api/categorias", token, tienda, Map.of("nombre", "Polos"))
                .andExpect(status().isCreated()));
        Long producto = crearProducto(token, tienda, "Polo azul", "39.90");
        crearProducto(token, tienda, "Polo rojo", "39.90");

        delete("/api/categorias/" + categoria, token, tienda).andExpect(status().isNoContent());
        delete("/api/productos/" + producto, token, tienda).andExpect(status().isNoContent());

        // Sin el parámetro, el comportamiento de siempre: solo los activos.
        get("/api/categorias", token, tienda).andExpect(jsonPath("$", hasSize(0)));
        get("/api/productos", token, tienda).andExpect(jsonPath("$", hasSize(1)));

        get("/api/categorias?incluirInactivos=true", token, tienda)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].activo").value(false));
        get("/api/productos?incluirInactivos=true", token, tienda)
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.id == " + producto + ")].activo").value(false));

        // Nunca aparecen los de otra tienda.
        String otroToken = registrarPropietario("otro-inactivos@tienda.pe");
        Long otraTienda = crearTienda(otroToken, "otra-inactivos", "Emprendedor");
        get("/api/productos?incluirInactivos=true", otroToken, otraTienda).andExpect(jsonPath("$", hasSize(0)));
        get("/api/categorias?incluirInactivos=true", otroToken, otraTienda).andExpect(jsonPath("$", hasSize(0)));
    }
}
