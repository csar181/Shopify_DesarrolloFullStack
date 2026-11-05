package com.shopcloud.pago.repository;

import com.shopcloud.pago.entity.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Long> {

    List<MetodoPago> findByTiendaIdAndActivoTrueOrderByNombre(Long tiendaId);

    List<MetodoPago> findByTiendaIdOrderByNombre(Long tiendaId);

    Optional<MetodoPago> findByIdAndTiendaIdAndActivoTrue(Long metodoPagoId, Long tiendaId);

    Optional<MetodoPago> findByIdAndTiendaId(Long metodoPagoId, Long tiendaId);

    boolean existsByTiendaIdAndNombreIgnoreCase(Long tiendaId, String nombre);

    boolean existsByTiendaIdAndNombreIgnoreCaseAndIdNot(Long tiendaId, String nombre, Long id);
}
