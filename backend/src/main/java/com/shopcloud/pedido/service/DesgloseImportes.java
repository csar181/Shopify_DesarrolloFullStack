package com.shopcloud.pedido.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Los precios ya incluyen IGV. El descuento se resta del total de los productos y el
 * IGV se separa del importe resultante, con el mismo redondeo que exigen los CHECK de
 * la tabla pedidos.
 */
public record DesgloseImportes(
        BigDecimal subtotal,
        BigDecimal montoDescuento,
        BigDecimal baseImponible,
        BigDecimal montoIgv,
        BigDecimal total
) {

    public static final BigDecimal PORCENTAJE_IGV = new BigDecimal("18.00");

    private static final BigDecimal DIVISOR_IGV = new BigDecimal("1.18");

    public static DesgloseImportes calcular(BigDecimal subtotal, BigDecimal montoDescuento) {
        BigDecimal total = subtotal.subtract(montoDescuento);
        BigDecimal baseImponible = total.divide(DIVISOR_IGV, 2, RoundingMode.HALF_UP);

        return new DesgloseImportes(
                subtotal,
                montoDescuento,
                baseImponible,
                total.subtract(baseImponible),
                total
        );
    }
}
