package com.shopcloud.plan.service;

import com.shopcloud.catalogo.repository.CategoriaRepository;
import com.shopcloud.catalogo.repository.ImagenProductoRepository;
import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.exception.AccesoTiendaException;
import com.shopcloud.exception.CodigoError;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.plan.entity.Plan;
import com.shopcloud.plan.entity.Suscripcion;
import com.shopcloud.plan.repository.SuscripcionRepository;
import com.shopcloud.tienda.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Aplica los límites guardados en la tabla planes. Un límite NULL significa ilimitado.
 * Lo existente nunca se borra: al bajar de plan solo se impide crear más.
 */
@Service
@RequiredArgsConstructor
public class LimitesPlanService {

    public enum NivelEstadisticas { BASICAS, INTERMEDIAS, AVANZADAS }

    private static final String CLAVE_ESTADISTICAS = "estadisticas";

    private final AccesoTiendaService accesoTiendaService;
    private final SuscripcionRepository suscripcionRepository;
    private final TiendaRepository tiendaRepository;
    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ImagenProductoRepository imagenProductoRepository;

    /** Debe llamarse dentro de la transacción que crea o reactiva el producto. */
    @Transactional
    public void verificarCupoProductos(Long tiendaId) {
        Plan plan = obtenerPlanBloqueandoTienda(tiendaId);
        verificar(plan.getMaxProductos(),
                productoRepository.countByTiendaIdAndActivoTrue(tiendaId),
                plan, "productos");
    }

    /** Debe llamarse dentro de la transacción que crea o reactiva la categoría. */
    @Transactional
    public void verificarCupoCategorias(Long tiendaId) {
        Plan plan = obtenerPlanBloqueandoTienda(tiendaId);
        verificar(plan.getMaxCategorias(),
                categoriaRepository.countByTiendaIdAndActivoTrue(tiendaId),
                plan, "categorías");
    }

    /** Debe llamarse dentro de la transacción que agrega la imagen. */
    @Transactional
    public void verificarCupoImagenes(Long tiendaId, Long productoId) {
        Plan plan = obtenerPlanBloqueandoTienda(tiendaId);
        verificar(plan.getMaxImagenesProducto(),
                imagenProductoRepository.countByProductoId(productoId),
                plan, "imágenes por producto");
    }

    /**
     * Las estadísticas siguen siendo consultables en modo de solo lectura:
     * sin suscripción vigente se usa el último plan de la tienda.
     */
    @Transactional(readOnly = true)
    public void exigirEstadisticas(Long tiendaId, NivelEstadisticas requerido) {
        if (nivelEstadisticas(tiendaId).compareTo(requerido) < 0) {
            throw new AccesoTiendaException(
                    HttpStatus.FORBIDDEN,
                    CodigoError.FUNCIONALIDAD_NO_INCLUIDA,
                    "Estas estadísticas no están incluidas en el plan de la tienda"
            );
        }
    }

    private NivelEstadisticas nivelEstadisticas(Long tiendaId) {
        Plan plan = accesoTiendaService.obtenerVigente(tiendaId)
                .or(() -> suscripcionRepository
                        .findFirstByTiendaIdOrderByCreadoEnDescIdDesc(tiendaId))
                .map(Suscripcion::getPlan)
                .orElse(null);

        Map<String, Object> funcionalidades = plan == null ? null : plan.getFuncionalidades();
        Object nivel = funcionalidades == null ? null : funcionalidades.get(CLAVE_ESTADISTICAS);

        return nivel == null
                ? NivelEstadisticas.BASICAS
                : NivelEstadisticas.valueOf(nivel.toString());
    }

    /** El bloqueo impide que dos altas simultáneas superen el límite. */
    private Plan obtenerPlanBloqueandoTienda(Long tiendaId) {
        tiendaRepository.findWithLockById(tiendaId);
        return accesoTiendaService.obtenerVigente(tiendaId)
                .map(Suscripcion::getPlan)
                .orElseThrow(() -> new AccesoTiendaException(
                        HttpStatus.FORBIDDEN,
                        CodigoError.SUSCRIPCION_REQUERIDA,
                        "La tienda está en modo de solo lectura. Contrate un plan para continuar"
                ));
    }

    private void verificar(Integer limite, long usados, Plan plan, String recurso) {
        if (limite != null && usados >= limite) {
            throw new ReglaNegocioException(
                    "El plan " + plan.getNombre() + " permite como máximo "
                            + limite + " " + recurso,
                    CodigoError.LIMITE_PLAN
            );
        }
    }
}
