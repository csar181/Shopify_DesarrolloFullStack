package com.shopcloud.carrito.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class CarritoDTO {

    private Long id;
    private List<ElementoCarritoDTO> elementos;
    private Integer cantidadTotal;
    private BigDecimal total;

    /** Avisos de la sincronización, por ejemplo cantidades ajustadas al stock. */
    private List<String> advertencias;
}
