package com.shopcloud.pedido.repository;

import com.shopcloud.pedido.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByClienteIdAndTiendaIdOrderByCreadoEnDesc(
            Long clienteId, Long tiendaId);
    Optional<Pedido> findByIdAndClienteIdAndTiendaId(
            Long pedidoId, Long clienteId, Long tiendaId);

    List<Pedido> findByTiendaIdOrderByCreadoEnDesc(Long tiendaId);

    List<Pedido> findByTiendaIdAndEstadoOrderByCreadoEnDesc(Long tiendaId, String estado);

    Optional<Pedido> findByIdAndTiendaId(Long pedidoId, Long tiendaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Pedido> findWithLockByIdAndTiendaId(Long pedidoId, Long tiendaId);

    boolean existsByDireccionId(Long direccionId);

    boolean existsByDatosFacturacionId(Long datosFacturacionId);

    interface ResumenPedidoDiarioProjection {
        LocalDate getFecha();
        Long getCantidadPedidos();
        Long getCantidadClientes();
        BigDecimal getMontoVentas();
    }

    interface ResumenPedidoRangoProjection {
        Long getCantidadPedidos();
        Long getCantidadClientes();
        BigDecimal getMontoVentas();
    }

    @Query(value = """
            SELECT CAST(p.creado_en AS date) AS fecha,
                   COUNT(p.id) AS "cantidadPedidos",
                   COUNT(DISTINCT p.cliente_id) AS "cantidadClientes",
                   COALESCE(SUM(p.total), 0) AS "montoVentas"
            FROM pedidos p
            WHERE p.tienda_id = :tiendaId
              AND p.estado IN ('CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO')
              AND p.creado_en >= :inicio
              AND p.creado_en < :finExclusivo
            GROUP BY CAST(p.creado_en AS date)
            ORDER BY CAST(p.creado_en AS date)
            """, nativeQuery = true)
    List<ResumenPedidoDiarioProjection> resumirVentasDiarias(
            @Param("tiendaId") Long tiendaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("finExclusivo") LocalDateTime finExclusivo);

    @Query(value = """
            SELECT COUNT(p.id) AS "cantidadPedidos",
                   COUNT(DISTINCT p.cliente_id) AS "cantidadClientes",
                   COALESCE(SUM(p.total), 0) AS "montoVentas"
            FROM pedidos p
            WHERE p.tienda_id = :tiendaId
              AND p.estado IN ('CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO')
              AND p.creado_en >= :inicio
              AND p.creado_en < :finExclusivo
            """, nativeQuery = true)
    ResumenPedidoRangoProjection resumirVentasDelRango(
            @Param("tiendaId") Long tiendaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("finExclusivo") LocalDateTime finExclusivo);
}
