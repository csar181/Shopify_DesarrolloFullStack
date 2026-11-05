package com.shopcloud.carrito.repository;

import com.shopcloud.carrito.entity.Carrito;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface CarritoRepository extends JpaRepository<Carrito, Long> {

    Optional<Carrito> findByClienteIdAndTiendaIdAndEstado(
            Long clienteId, Long tiendaId, String estado);

    /** Evita que dos checkouts simultáneos conviertan el mismo carrito. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Carrito> findWithLockByClienteIdAndTiendaIdAndEstado(
            Long clienteId, Long tiendaId, String estado);
}
