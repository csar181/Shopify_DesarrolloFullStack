package com.shopcloud.pedido.repository;

import com.shopcloud.pedido.entity.ElementoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ElementoPedidoRepository extends JpaRepository<ElementoPedido, Long> {
    List<ElementoPedido> findByPedidoIdOrderById(Long pedidoId);

    interface ProductosVendidosDiariosProjection {
        LocalDate getFecha();
        Long getCantidad();
    }

    interface ProductoMasVendidoProjection {
        Long getProductoId();
        String getNombreProducto();
        Long getCantidadVendida();
        BigDecimal getMontoGenerado();
    }

    @Query(value = """
            SELECT CAST(p.creado_en AS date) AS fecha,
                   COALESCE(SUM(ep.cantidad), 0) AS cantidad
            FROM elementos_pedido ep
            JOIN pedidos p ON p.id = ep.pedido_id
            WHERE p.tienda_id = :tiendaId
              AND p.estado IN ('CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO')
              AND p.creado_en >= :inicio
              AND p.creado_en < :finExclusivo
            GROUP BY CAST(p.creado_en AS date)
            """, nativeQuery = true)
    List<ProductosVendidosDiariosProjection> resumirUnidadesVendidasDiarias(
            @Param("tiendaId") Long tiendaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("finExclusivo") LocalDateTime finExclusivo);

    @Query(value = """
            SELECT COALESCE(SUM(ep.cantidad), 0)
            FROM elementos_pedido ep
            JOIN pedidos p ON p.id = ep.pedido_id
            WHERE p.tienda_id = :tiendaId
              AND p.estado IN ('CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO')
              AND p.creado_en >= :inicio
              AND p.creado_en < :finExclusivo
            """, nativeQuery = true)
    Long sumarUnidadesVendidas(
            @Param("tiendaId") Long tiendaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("finExclusivo") LocalDateTime finExclusivo);

    @Query(value = """
            SELECT ep.producto_id AS "productoId",
                   MAX(ep.nombre_producto) AS "nombreProducto",
                   SUM(ep.cantidad) AS "cantidadVendida",
                   COALESCE(SUM(ep.subtotal), 0) AS "montoGenerado"
            FROM elementos_pedido ep
            JOIN pedidos p ON p.id = ep.pedido_id
            WHERE p.tienda_id = :tiendaId
              AND p.estado IN ('CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO')
              AND p.creado_en >= :inicio
              AND p.creado_en < :finExclusivo
            GROUP BY ep.producto_id
            ORDER BY SUM(ep.cantidad) DESC, SUM(ep.subtotal) DESC, ep.producto_id
            LIMIT :limite
            """, nativeQuery = true)
    List<ProductoMasVendidoProjection> listarProductosMasVendidos(
            @Param("tiendaId") Long tiendaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("finExclusivo") LocalDateTime finExclusivo,
            @Param("limite") int limite);
}
