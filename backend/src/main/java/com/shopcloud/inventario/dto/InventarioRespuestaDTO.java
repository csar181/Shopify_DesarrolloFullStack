package com.shopcloud.inventario.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InventarioRespuestaDTO {

    private Long id;

    private Long productoId;
    private String productoNombre;

    private Long varianteId;
    private String varianteNombre;

    private Integer cantidad;
    private Integer cantidadMinima;

    private Boolean stockBajo;

    private LocalDateTime actualizadoEn;
}