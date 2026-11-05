package com.shopcloud.descuento.repository;

import com.shopcloud.descuento.entity.Descuento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DescuentoRepository
        extends JpaRepository<Descuento, Long> {

    List<Descuento> findByTiendaId(
            Long tiendaId
    );

    List<Descuento> findByTiendaIdAndActivoTrue(
            Long tiendaId
    );

    Optional<Descuento> findByIdAndTiendaId(
            Long descuentoId,
            Long tiendaId
    );

    Optional<Descuento> findByCodigoIgnoreCaseAndTiendaId(
            String codigo,
            Long tiendaId
    );

    boolean existsByCodigoIgnoreCaseAndTiendaId(
            String codigo,
            Long tiendaId
    );

    boolean existsByCodigoIgnoreCaseAndTiendaIdAndIdNot(
            String codigo,
            Long tiendaId,
            Long descuentoId
    );
}