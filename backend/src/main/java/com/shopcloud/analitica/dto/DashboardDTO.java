package com.shopcloud.analitica.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardDTO {
    private LocalDate desde;
    private LocalDate hasta;
    private BigDecimal ventasTotales;
    private Long pedidosPagados;
    private Long productosVendidos;
    private Long clientesCompradores;
    private BigDecimal ticketPromedio;
}
