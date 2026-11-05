package com.shopcloud.descuento.service;

import com.shopcloud.descuento.entity.Descuento;

import java.math.BigDecimal;

public record DescuentoAplicado(Descuento descuento, BigDecimal monto) {
}
