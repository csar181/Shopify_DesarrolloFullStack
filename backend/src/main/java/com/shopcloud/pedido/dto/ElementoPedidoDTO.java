package com.shopcloud.pedido.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ElementoPedidoDTO {

    private Long id;
    private Long productoId;
    private String nombreProducto;
    private Long varianteId;
    private String nombreVariante;
    private String sku;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}
