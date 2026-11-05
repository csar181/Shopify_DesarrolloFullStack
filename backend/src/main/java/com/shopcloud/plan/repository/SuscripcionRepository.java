package com.shopcloud.plan.repository;

import com.shopcloud.plan.entity.Suscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {

    List<Suscripcion> findByTiendaIdOrderByCreadoEnDescIdDesc(Long tiendaId);

    Optional<Suscripcion> findFirstByTiendaIdAndEstado(Long tiendaId, String estado);

    Optional<Suscripcion> findFirstByTiendaIdOrderByCreadoEnDescIdDesc(Long tiendaId);

    @Query("""
            SELECT s FROM Suscripcion s
            JOIN FETCH s.plan
            WHERE s.tienda.id = :tiendaId
              AND s.estado = 'ACTIVA'
              AND s.fechaInicio <= :ahora
              AND s.fechaFin > :ahora
            """)
    Optional<Suscripcion> buscarVigente(
            @Param("tiendaId") Long tiendaId,
            @Param("ahora") LocalDateTime ahora);

    @Modifying
    @Query("""
            UPDATE Suscripcion s
            SET s.estado = 'VENCIDA'
            WHERE s.estado = 'ACTIVA' AND s.fechaFin <= :ahora
            """)
    int marcarVencidas(@Param("ahora") LocalDateTime ahora);
}
