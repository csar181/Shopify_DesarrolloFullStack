package com.shopcloud.analitica.service;

import com.shopcloud.analitica.dto.DashboardDTO;
import com.shopcloud.pedido.repository.ElementoPedidoRepository;
import com.shopcloud.pedido.repository.PedidoRepository;
import com.shopcloud.plan.service.LimitesPlanService;
import com.shopcloud.tenant.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnaliticaServiceTest {
    private static final Long TIENDA_ID = 1L;
    private static final LocalDate DESDE = LocalDate.of(2026, 9, 1);
    private static final LocalDate HASTA = LocalDate.of(2026, 9, 30);

    @Mock private PedidoRepository pedidoRepository;
    @Mock private ElementoPedidoRepository elementoPedidoRepository;
    @Mock private TenantService tenantService;
    @Mock private LimitesPlanService limitesPlanService;
    private AnaliticaService service;

    @BeforeEach
    void setUp() {
        service = new AnaliticaService(pedidoRepository,
                elementoPedidoRepository, tenantService, limitesPlanService);
        lenient().when(tenantService.obtenerTenantId()).thenReturn(TIENDA_ID);
        lenient().when(pedidoRepository.resumirVentasDiarias(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        lenient().when(elementoPedidoRepository.resumirUnidadesVendidasDiarias(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        lenient().when(elementoPedidoRepository.sumarUnidadesVendidas(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(0L);
    }

    @Test
    void dashboardSinVentasDevuelveCeros() {
        PedidoRepository.ResumenPedidoRangoProjection resumen =
                resumenRango(0L, 0L, BigDecimal.ZERO);
        when(pedidoRepository.resumirVentasDelRango(anyLong(), any(), any()))
                .thenReturn(resumen);

        DashboardDTO resultado = service.obtenerDashboard(DESDE, HASTA);

        assertEquals(0L, resultado.getPedidosPagados());
        assertEquals(0L, resultado.getProductosVendidos());
        assertEquals(0L, resultado.getClientesCompradores());
        assertEquals(new BigDecimal("0.00"), resultado.getVentasTotales());
        assertEquals(new BigDecimal("0.00"), resultado.getTicketPromedio());
    }

    @Test
    void unPedidoPagadoCuentaUnaVenta() {
        prepararDashboard(1L, 1L, 2L, "179.80");
        assertEquals(1L, service.obtenerDashboard(DESDE, HASTA).getPedidosPagados());
    }

    @Test
    void pedidoPendienteNoApareceEnLosAgregados() {
        prepararDashboard(0L, 0L, 0L, "0.00");
        DashboardDTO resultado = service.obtenerDashboard(DESDE, HASTA);
        assertEquals(0L, resultado.getPedidosPagados());
        verify(pedidoRepository).resumirVentasDelRango(eq(TIENDA_ID), any(), any());
    }

    @Test
    void montoSumaSolamenteResultadoAgregadoDePagados() {
        prepararDashboard(2L, 2L, 3L, "429.80");
        assertEquals(new BigDecimal("429.80"),
                service.obtenerDashboard(DESDE, HASTA).getVentasTotales());
    }

    @Test
    void productosVendidosSumaUnidades() {
        prepararDashboard(2L, 2L, 6L, "400.00");
        assertEquals(6L, service.obtenerDashboard(DESDE, HASTA).getProductosVendidos());
    }

    @Test
    void clientesSonDistintosEnTodoElRango() {
        prepararDashboard(4L, 2L, 4L, "400.00");
        assertEquals(2L, service.obtenerDashboard(DESDE, HASTA).getClientesCompradores());
    }

    @Test
    void ticketPromedioUsaDivisionDecimal() {
        prepararDashboard(2L, 2L, 3L, "429.80");
        assertEquals(new BigDecimal("214.90"),
                service.obtenerDashboard(DESDE, HASTA).getTicketPromedio());
    }

    @Test
    void dosPedidosDelMismoClienteCuentanDosPedidosYUnCliente() {
        prepararDashboard(2L, 1L, 2L, "200.00");
        DashboardDTO resultado = service.obtenerDashboard(DESDE, HASTA);
        assertEquals(2L, resultado.getPedidosPagados());
        assertEquals(1L, resultado.getClientesCompradores());
    }

    @Test
    void siempreConsultaConElTenantActual() {
        when(tenantService.obtenerTenantId()).thenReturn(22L);
        prepararDashboard(1L, 1L, 1L, "50.00");

        service.obtenerDashboard(DESDE, HASTA);

        verify(pedidoRepository).resumirVentasDelRango(eq(22L), any(), any());
        verify(elementoPedidoRepository).sumarUnidadesVendidas(eq(22L), any(), any());
    }

    @Test
    void rangoInvalidoProduceErrorDeValidacion() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.obtenerDashboard(HASTA, DESDE));
        assertEquals("desde no puede ser posterior a hasta", error.getMessage());
        verifyNoInteractions(pedidoRepository, elementoPedidoRepository);
    }

    private void prepararDashboard(long pedidos, long clientes, long unidades,
                                   String ventas) {
        PedidoRepository.ResumenPedidoRangoProjection resumen =
                resumenRango(pedidos, clientes, new BigDecimal(ventas));
        when(pedidoRepository.resumirVentasDelRango(anyLong(), any(), any()))
                .thenReturn(resumen);
        when(elementoPedidoRepository.sumarUnidadesVendidas(anyLong(), any(), any()))
                .thenReturn(unidades);
    }

    private PedidoRepository.ResumenPedidoRangoProjection resumenRango(
            Long pedidos, Long clientes, BigDecimal ventas) {
        PedidoRepository.ResumenPedidoRangoProjection resumen =
                mock(PedidoRepository.ResumenPedidoRangoProjection.class);
        when(resumen.getCantidadPedidos()).thenReturn(pedidos);
        when(resumen.getCantidadClientes()).thenReturn(clientes);
        when(resumen.getMontoVentas()).thenReturn(ventas);
        return resumen;
    }

    private PedidoRepository.ResumenPedidoDiarioProjection resumenDiario(
            LocalDate fecha, Long pedidos, Long clientes, String ventas) {
        PedidoRepository.ResumenPedidoDiarioProjection resumen =
                mock(PedidoRepository.ResumenPedidoDiarioProjection.class);
        when(resumen.getFecha()).thenReturn(fecha);
        when(resumen.getCantidadPedidos()).thenReturn(pedidos);
        when(resumen.getCantidadClientes()).thenReturn(clientes);
        when(resumen.getMontoVentas()).thenReturn(new BigDecimal(ventas));
        return resumen;
    }
}
