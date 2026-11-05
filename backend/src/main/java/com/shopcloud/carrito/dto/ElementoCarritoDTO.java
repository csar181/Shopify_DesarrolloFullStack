package com.shopcloud.carrito.dto;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter @Builder
public class ElementoCarritoDTO {
    private Long id;
    private Long productoId;
    private String nombreProducto;
    private Long varianteId;
    private String nombreVariante;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}
