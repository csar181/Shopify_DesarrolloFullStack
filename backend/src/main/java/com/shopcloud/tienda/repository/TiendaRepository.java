package com.shopcloud.tienda.repository;

import com.shopcloud.tienda.entity.Tienda;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface TiendaRepository extends JpaRepository<Tienda, Long> {

    boolean existsBySlug(String slug);

    Optional<Tienda> findBySlug(String slug);

    List<Tienda> findByPropietarioId(Long propietarioId);

    Optional<Tienda> findByIdAndPropietarioId(Long tiendaId, Long propietarioId);

    /** Serializa las operaciones que dependen de contadores o suscripciones de la tienda. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Tienda> findWithLockById(Long tiendaId);
}
