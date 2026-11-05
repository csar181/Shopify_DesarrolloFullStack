package com.shopcloud.descuento.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class DescuentoRespuestaDTO {

    private Long id;

    private String codigo;
    private String tipo;

    private BigDecimal valor;

    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;

    private Boolean activo;

    // Calculado, no existe como columna en PostgreSQL
    private Boolean vigente;
}