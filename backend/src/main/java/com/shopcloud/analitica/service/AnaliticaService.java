package com.shopcloud.analitica.service;

import com.shopcloud.analitica.dto.DashboardDTO;
import com.shopcloud.analitica.dto.ProductoVendidoDTO;
import com.shopcloud.analitica.dto.ResumenVentasDTO;
import com.shopcloud.pedido.repository.ElementoPedidoRepository;
import com.shopcloud.pedido.repository.PedidoRepository;
import com.shopcloud.plan.service.LimitesPlanService;
import com.shopcloud.plan.service.LimitesPlanService.NivelEstadisticas;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Calcula las ventas directamente desde los pedidos, sin tabla de resumen.
 * Niveles: básicas (dashboard), intermedias (resumen diario), avanzadas (más vendidos).
 */
@Service
@RequiredArgsConstructor
public class AnaliticaService {

    private static final int LIMITE_MAXIMO_PRODUCTOS = 100;

    private final PedidoRepository pedidoRepository;
    private final ElementoPedidoRepository elementoPedidoRepository;
    private final TenantService tenantService;
    private final LimitesPlanService limitesPlanService;

    @Transactional(readOnly = true)
    public DashboardDTO obtenerDashboard(LocalDate desde, LocalDate hasta) {
        Rango rango = resolverRango(desde, hasta);
        Long tiendaId = tenantService.obtenerTenantId();
        limitesPlanService.exigirEstadisticas(tiendaId, NivelEstadisticas.BASICAS);

        PedidoRepository.ResumenPedidoRangoProjection resumen =
                pedidoRepository.resumirVentasDelRango(
                        tiendaId, rango.inicio(), rango.finExclusivo());

        long pedidos = valor(resumen == null ? null : resumen.getCantidadPedidos());
        long clientes = valor(resumen == null ? null : resumen.getCantidadClientes());
        BigDecimal ventas = dinero(resumen == null ? null : resumen.getMontoVentas());
        long productos = valor(elementoPedidoRepository.sumarUnidadesVendidas(
                tiendaId, rango.inicio(), rango.finExclusivo()));

        return DashboardDTO.builder()
                .desde(rango.desde())
                .hasta(rango.hasta())
                .ventasTotales(ventas)
                .pedidosPagados(pedidos)
                .productosVendidos(productos)
                .clientesCompradores(clientes)
                .ticketPromedio(calcularTicketPromedio(ventas, pedidos))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ResumenVentasDTO> obtenerVentasDiarias(LocalDate desde, LocalDate hasta) {
        Rango rango = resolverRango(desde, hasta);
        Long tiendaId = tenantService.obtenerTenantId();
        limitesPlanService.exigirEstadisticas(tiendaId, NivelEstadisticas.INTERMEDIAS);

        Map<LocalDate, Long> unidadesPorDia = new HashMap<>();
        elementoPedidoRepository.resumirUnidadesVendidasDiarias(
                        tiendaId, rango.inicio(), rango.finExclusivo())
                .forEach(r -> unidadesPorDia.put(r.getFecha(), valor(r.getCantidad())));

        return pedidoRepository.resumirVentasDiarias(tiendaId, rango.inicio(), rango.finExclusivo())
                .stream()
                .map(r -> ResumenVentasDTO.builder()
                        .fecha(r.getFecha())
                        .cantidadPedidos(Math.toIntExact(valor(r.getCantidadPedidos())))
                        .productosVendidos(Math.toIntExact(unidadesPorDia.getOrDefault(r.getFecha(), 0L)))
                        .cantidadClientes(Math.toIntExact(valor(r.getCantidadClientes())))
                        .montoVentas(dinero(r.getMontoVentas()))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoVendidoDTO> obtenerProductosMasVendidos(
            LocalDate desde, LocalDate hasta, Integer limite) {
        Rango rango = resolverRango(desde, hasta);
        Long tiendaId = tenantService.obtenerTenantId();
        limitesPlanService.exigirEstadisticas(tiendaId, NivelEstadisticas.AVANZADAS);

        int limiteValidado = limite == null ? 5 : limite;
        if (limiteValidado < 1 || limiteValidado > LIMITE_MAXIMO_PRODUCTOS) {
            throw new IllegalArgumentException("limite debe estar entre 1 y 100");
        }

        return elementoPedidoRepository
                .listarProductosMasVendidos(
                        tiendaId, rango.inicio(), rango.finExclusivo(), limiteValidado)
                .stream()
                .map(p -> ProductoVendidoDTO.builder()
                        .productoId(p.getProductoId())
                        .nombreProducto(p.getNombreProducto())
                        .cantidadVendida(valor(p.getCantidadVendida()))
                        .montoGenerado(dinero(p.getMontoGenerado()))
                        .build())
                .toList();
    }

    private Rango resolverRango(LocalDate desde, LocalDate hasta) {
        LocalDate hoy = LocalDate.now();
        LocalDate fechaDesde = desde == null ? hoy.with(TemporalAdjusters.firstDayOfMonth()) : desde;
        LocalDate fechaHasta = hasta == null ? hoy.with(TemporalAdjusters.lastDayOfMonth()) : hasta;

        if (fechaDesde.isAfter(fechaHasta)) {
            throw new IllegalArgumentException("desde no puede ser posterior a hasta");
        }

        return new Rango(fechaDesde, fechaHasta, fechaDesde.atStartOfDay(),
                fechaHasta.plusDays(1).atStartOfDay());
    }

    private BigDecimal calcularTicketPromedio(BigDecimal ventas, long pedidos) {
        return pedidos == 0
                ? BigDecimal.ZERO.setScale(2)
                : ventas.divide(BigDecimal.valueOf(pedidos), 2, RoundingMode.HALF_UP);
    }

    private long valor(Long valor) {
        return valor == null ? 0L : valor;
    }

    private BigDecimal dinero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO.setScale(2) : valor.setScale(2);
    }

    private record Rango(LocalDate desde, LocalDate hasta,
                         LocalDateTime inicio, LocalDateTime finExclusivo) {
    }
}
