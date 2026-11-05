package com.shopcloud.catalogo.dto.publico;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class VariantePublicaDTO {

    private Long id;
    private String nombre;
    private BigDecimal precio;
    private Integer stock;
}
