package com.shopcloud.analitica.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResumenVentasDTO {
    private LocalDate fecha;
    private Integer cantidadPedidos;
    private Integer productosVendidos;
    private Integer cantidadClientes;
    private BigDecimal montoVentas;
}
