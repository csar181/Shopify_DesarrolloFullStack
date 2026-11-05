package com.shopcloud.pago.repository;

import com.shopcloud.pago.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    Optional<Transaccion> findByPedidoId(Long pedidoId);

    List<Transaccion> findByPedidoClienteIdAndTiendaIdOrderByCreadoEnDesc(
            Long clienteId, Long tiendaId);

    Optional<Transaccion> findByIdAndPedidoClienteIdAndTiendaId(
            Long transaccionId, Long clienteId, Long tiendaId);

    List<Transaccion> findByTiendaIdOrderByCreadoEnDesc(Long tiendaId);

    Optional<Transaccion> findByIdAndTiendaId(Long transaccionId, Long tiendaId);
}
