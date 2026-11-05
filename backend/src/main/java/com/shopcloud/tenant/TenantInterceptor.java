package com.shopcloud.tenant;

import com.shopcloud.exception.AccesoDenegadoException;
import com.shopcloud.exception.AccesoTiendaException;
import com.shopcloud.exception.CodigoError;
import com.shopcloud.plan.service.AccesoTiendaService;
import com.shopcloud.security.ClientePrincipal;
import com.shopcloud.security.UsuarioPrincipal;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;

/**
 * Determina la tienda de cada petición sin confiar en lo que envía el cliente:
 * - Cliente: la tienda sale de su token; la cabecera, si llega, debe coincidir.
 * - Propietario: la cabecera se comprueba contra tiendas.propietario_id.
 */
@Component
@RequiredArgsConstructor
public class TenantInterceptor implements HandlerInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    private static final List<String> RUTAS_CLIENTE = List.of(
            "/api/mi-cuenta", "/api/carrito", "/api/checkout", "/api/pedidos", "/api/pagos"
    );

    /** Consultas de cliente disponibles aunque la tienda deje de estar publicada. */
    private static final List<String> CONSULTAS_HISTORICAS = List.of(
            "/api/pedidos", "/api/pagos/transacciones", "/api/mi-cuenta"
    );

    private static final List<String> RUTA_GESTION_PEDIDOS = List.of("/api/gestion/pedidos");
    private static final List<String> RUTA_SUSCRIPCIONES = List.of("/api/suscripciones");

    private final TiendaRepository tiendaRepository;
    private final AccesoTiendaService accesoTiendaService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        String ruta = request.getRequestURI();
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        Object principal = autenticacion == null ? null : autenticacion.getPrincipal();

        Long tiendaId = coincide(ruta, RUTAS_CLIENTE)
                ? resolverTiendaCliente(request, ruta, principal)
                : resolverTiendaPropietario(request, ruta, principal);

        TenantContext.setTenantId(tiendaId);
        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex
    ) {
        TenantContext.clear();
    }

    private Long resolverTiendaCliente(HttpServletRequest request, String ruta, Object principal) {
        if (!(principal instanceof ClientePrincipal cliente)) {
            throw new AccesoDenegadoException("Esta ruta es exclusiva para clientes de la tienda");
        }

        Long tiendaId = cliente.getTiendaId();
        String cabecera = request.getHeader(TENANT_HEADER);

        if (cabecera != null && !cabecera.isBlank() && !cabecera.trim().equals(tiendaId.toString())) {
            throw new AccesoDenegadoException("La sesión no pertenece a esta tienda");
        }

        boolean consultaHistorica = esLectura(request) && coincide(ruta, CONSULTAS_HISTORICAS);

        if (!consultaHistorica && !accesoTiendaService.estaPublicada(tiendaId)) {
            throw new AccesoTiendaException(
                    HttpStatus.FORBIDDEN,
                    CodigoError.TIENDA_NO_DISPONIBLE,
                    "La tienda no está disponible en este momento"
            );
        }
        return tiendaId;
    }

    private Long resolverTiendaPropietario(HttpServletRequest request, String ruta, Object principal) {
        if (!(principal instanceof UsuarioPrincipal propietario)) {
            throw new AccesoDenegadoException("Esta ruta es exclusiva para propietarios");
        }

        Tienda tienda = tiendaRepository
                .findByIdAndPropietarioId(leerCabeceraTienda(request), propietario.getId())
                .orElseThrow(() -> new AccesoDenegadoException("No tiene acceso a esta tienda"));

        if (!esLectura(request)) {
            validarEscritura(tienda, ruta);
        }
        return tienda.getId();
    }

    private void validarEscritura(Tienda tienda, String ruta) {
        // Las ventas ya realizadas se siguen gestionando aunque venza la suscripción.
        if (coincide(ruta, RUTA_GESTION_PEDIDOS)) {
            return;
        }
        // Contratar o renovar debe seguir disponible sin una suscripción vigente.
        if (coincide(ruta, RUTA_SUSCRIPCIONES)) {
            accesoTiendaService.exigirTiendaActiva(tienda);
            return;
        }
        accesoTiendaService.exigirAdministrable(tienda);
    }

    private Long leerCabeceraTienda(HttpServletRequest request) {
        String cabecera = request.getHeader(TENANT_HEADER);
        if (cabecera == null || cabecera.isBlank()) {
            throw new IllegalArgumentException("El encabezado X-Tenant-ID es obligatorio");
        }
        try {
            return Long.valueOf(cabecera.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("X-Tenant-ID debe ser un número válido");
        }
    }

    private boolean esLectura(HttpServletRequest request) {
        return "GET".equals(request.getMethod()) || "HEAD".equals(request.getMethod());
    }

    private boolean coincide(String ruta, List<String> prefijos) {
        return prefijos.stream()
                .anyMatch(prefijo -> ruta.equals(prefijo) || ruta.startsWith(prefijo + "/"));
    }
}
