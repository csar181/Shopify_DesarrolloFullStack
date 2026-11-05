package com.shopcloud.analitica.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductoVendidoDTO {
    private Long productoId;
    private String nombreProducto;
    private Long cantidadVendida;
    private BigDecimal montoGenerado;
}
