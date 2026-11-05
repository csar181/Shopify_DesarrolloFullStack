package com.shopcloud.plan.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class SuscripcionRespuestaDTO {

    private Long id;
    private Long tiendaId;
    private Long planId;
    private String planNombre;
    private BigDecimal planPrecio;
    private String tipo;
    private String estado;
    private Boolean vigente;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private BigDecimal montoPagado;
    private LocalDateTime pagadoEn;
    private LocalDateTime creadoEn;
}
