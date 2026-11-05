package com.shopcloud.plan.service;

import com.shopcloud.exception.AccesoTiendaException;
import com.shopcloud.exception.CodigoError;
import com.shopcloud.plan.entity.Suscripcion;
import com.shopcloud.plan.repository.SuscripcionRepository;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Único punto que decide qué puede hacer una tienda. La publicación no se guarda:
 * se calcula en cada petición, así que no depende del proceso programado.
 *
 * - Administrable: tienda activa con una suscripción vigente (prueba o pagada).
 * - Publicada: tienda activa con una suscripción pagada vigente.
 */
@Service
@RequiredArgsConstructor
public class AccesoTiendaService {

    private final SuscripcionRepository suscripcionRepository;
    private final TiendaRepository tiendaRepository;

    @Transactional(readOnly = true)
    public Optional<Suscripcion> obtenerVigente(Long tiendaId) {
        return suscripcionRepository.buscarVigente(tiendaId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public boolean estaPublicada(Long tiendaId) {
        return tiendaRepository.findById(tiendaId)
                .map(this::estaPublicada)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean estaPublicada(Tienda tienda) {
        return Boolean.TRUE.equals(tienda.getActivo())
                && obtenerVigente(tienda.getId()).map(Suscripcion::esPagada).orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean esAdministrable(Tienda tienda) {
        return Boolean.TRUE.equals(tienda.getActivo())
                && obtenerVigente(tienda.getId()).isPresent();
    }

    @Transactional(readOnly = true)
    public void exigirPublicada(Long tiendaId) {
        if (!estaPublicada(tiendaId)) {
            throw new AccesoTiendaException(
                    HttpStatus.FORBIDDEN,
                    CodigoError.TIENDA_NO_DISPONIBLE,
                    "La tienda no está disponible en este momento"
            );
        }
    }

    public void exigirTiendaActiva(Tienda tienda) {
        if (!Boolean.TRUE.equals(tienda.getActivo())) {
            throw new AccesoTiendaException(
                    HttpStatus.FORBIDDEN,
                    CodigoError.TIENDA_DESACTIVADA,
                    "La tienda está desactivada. Reactívela para continuar"
            );
        }
    }

    @Transactional(readOnly = true)
    public void exigirAdministrable(Tienda tienda) {
        exigirTiendaActiva(tienda);
        if (obtenerVigente(tienda.getId()).isEmpty()) {
            throw new AccesoTiendaException(
                    HttpStatus.FORBIDDEN,
                    CodigoError.SUSCRIPCION_REQUERIDA,
                    "La tienda está en modo de solo lectura. Contrate un plan para continuar"
            );
        }
    }
}
