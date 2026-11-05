package com.shopcloud.pedido.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ResumenCheckoutDTO {

    private BigDecimal subtotal;
    private String codigoDescuento;
    private BigDecimal montoDescuento;
    private BigDecimal baseImponible;
    private BigDecimal porcentajeIgv;
    private BigDecimal montoIgv;
    private BigDecimal total;
}
