package com.shopcloud.plan.service;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.plan.dto.SeleccionPlanDTO;
import com.shopcloud.plan.dto.SuscripcionRespuestaDTO;
import com.shopcloud.plan.entity.Plan;
import com.shopcloud.plan.entity.Suscripcion;
import com.shopcloud.plan.repository.PlanRepository;
import com.shopcloud.plan.repository.SuscripcionRepository;
import com.shopcloud.tenant.TenantService;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cada pago simulado crea una fila PAGADA propia y nunca se reescribe la de un pago
 * anterior. Una renovación cierra la fila vigente y suma un periodo a su fecha de fin,
 * de modo que se conservan los días restantes y solo hay una fila ACTIVA por tienda.
 */
@Service
@RequiredArgsConstructor
public class SuscripcionService {

    private static final int DIAS_PRUEBA = 7;

    private final SuscripcionRepository suscripcionRepository;
    private final PlanRepository planRepository;
    private final TiendaRepository tiendaRepository;
    private final TenantService tenantService;
    private final AccesoTiendaService accesoTiendaService;

    /** Se llama al crear la tienda. El índice único impide una segunda prueba. */
    @Transactional
    public Suscripcion crearPrueba(Tienda tienda, Long planId) {
        LocalDateTime ahora = LocalDateTime.now();
        return suscripcionRepository.save(
                Suscripcion.builder()
                        .tienda(tienda)
                        .plan(buscarPlanActivo(planId))
                        .tipo(Suscripcion.TIPO_PRUEBA)
                        .estado(Suscripcion.ESTADO_ACTIVA)
                        .fechaInicio(ahora)
                        .fechaFin(ahora.plusDays(DIAS_PRUEBA))
                        .build()
        );
    }

    /** Registra el pago simulado: contrata, o renueva si ya hay un periodo pagado vigente. */
    @Transactional
    public SuscripcionRespuestaDTO contratar(SeleccionPlanDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();
        Tienda tienda = tiendaRepository.findWithLockById(tiendaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tienda no encontrada"));
        Plan plan = buscarPlanActivo(dto.getPlanId());
        LocalDateTime ahora = LocalDateTime.now();

        LocalDateTime inicioPeriodo = suscripcionRepository
                .findFirstByTiendaIdAndEstado(tiendaId, Suscripcion.ESTADO_ACTIVA)
                .map(actual -> cerrarParaContratar(actual, plan, ahora))
                .orElse(ahora);

        Suscripcion nueva = suscripcionRepository.save(
                Suscripcion.builder()
                        .tienda(tienda)
                        .plan(plan)
                        .tipo(Suscripcion.TIPO_PAGADA)
                        .estado(Suscripcion.ESTADO_ACTIVA)
                        .fechaInicio(ahora)
                        .fechaFin(sumarPeriodo(inicioPeriodo, plan))
                        .montoPagado(plan.getPrecio())
                        .pagadoEn(ahora)
                        .build()
        );
        return convertirDTO(nueva);
    }

    /** Solo durante la prueba, sin alterar su fecha de fin. */
    @Transactional
    public SuscripcionRespuestaDTO cambiarPlanEnPrueba(SeleccionPlanDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();
        Suscripcion vigente = accesoTiendaService.obtenerVigente(tiendaId)
                .orElseThrow(() -> new ReglaNegocioException(
                        "La tienda no tiene una suscripción vigente. Contrate un plan"));

        if (vigente.esPagada()) {
            throw new ReglaNegocioException(
                    "Con un plan pagado vigente solo se puede renovar. "
                            + "El cambio de plan estará disponible al vencer");
        }

        vigente.setPlan(buscarPlanActivo(dto.getPlanId()));
        return convertirDTO(suscripcionRepository.save(vigente));
    }

    @Transactional(readOnly = true)
    public List<SuscripcionRespuestaDTO> listar() {
        return suscripcionRepository
                .findByTiendaIdOrderByCreadoEnDescIdDesc(tenantService.obtenerTenantId())
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SuscripcionRespuestaDTO obtenerActiva() {
        return accesoTiendaService.obtenerVigente(tenantService.obtenerTenantId())
                .map(this::convertirDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "La tienda no tiene una suscripción vigente"));
    }

    /** La tienda deja de estar publicada de inmediato; el pago queda en el historial. */
    @Transactional
    public void cancelar() {
        Suscripcion vigente = accesoTiendaService
                .obtenerVigente(tenantService.obtenerTenantId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "La tienda no tiene una suscripción vigente"));

        vigente.setEstado(Suscripcion.ESTADO_CANCELADA);
        vigente.setFechaFin(LocalDateTime.now());
        suscripcionRepository.save(vigente);
    }

    /** Devuelve la fecha desde la que se cuenta el nuevo periodo. */
    private LocalDateTime cerrarParaContratar(Suscripcion actual, Plan plan, LocalDateTime ahora) {
        LocalDateTime inicioPeriodo = ahora;

        if (!actual.estaVigente(ahora)) {
            actual.setEstado(Suscripcion.ESTADO_VENCIDA);
        } else {
            if (actual.esPagada()) {
                if (!actual.getPlan().getId().equals(plan.getId())) {
                    throw new ReglaNegocioException(
                            "Con un plan pagado vigente solo se puede renovar el mismo plan. "
                                    + "El cambio de plan estará disponible al vencer");
                }
                inicioPeriodo = actual.getFechaFin();
            }
            actual.setEstado(Suscripcion.ESTADO_CANCELADA);
            actual.setFechaFin(ahora);
        }

        // Debe llegar a la base antes del INSERT: solo puede haber una fila ACTIVA.
        suscripcionRepository.saveAndFlush(actual);
        return inicioPeriodo;
    }

    private LocalDateTime sumarPeriodo(LocalDateTime desde, Plan plan) {
        return Plan.PERIODICIDAD_ANUAL.equals(plan.getPeriodicidad())
                ? desde.plusYears(1)
                : desde.plusMonths(1);
    }

    private Plan buscarPlanActivo(Long planId) {
        return planRepository.findByIdAndActivoTrue(planId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan activo no encontrado"));
    }

    private SuscripcionRespuestaDTO convertirDTO(Suscripcion suscripcion) {
        return SuscripcionRespuestaDTO.builder()
                .id(suscripcion.getId())
                .tiendaId(suscripcion.getTienda().getId())
                .planId(suscripcion.getPlan().getId())
                .planNombre(suscripcion.getPlan().getNombre())
                .planPrecio(suscripcion.getPlan().getPrecio())
                .tipo(suscripcion.getTipo())
                .estado(suscripcion.getEstado())
                .vigente(suscripcion.estaVigente(LocalDateTime.now()))
                .fechaInicio(suscripcion.getFechaInicio())
                .fechaFin(suscripcion.getFechaFin())
                .montoPagado(suscripcion.getMontoPagado())
                .pagadoEn(suscripcion.getPagadoEn())
                .creadoEn(suscripcion.getCreadoEn())
                .build();
    }
}
