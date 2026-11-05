package com.shopcloud.catalogo.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class VarianteRespuestaDTO {

    private Long id;
    private Long productoId;

    private String nombre;
    private String sku;

    private BigDecimal precio;

    private Boolean activo;
}