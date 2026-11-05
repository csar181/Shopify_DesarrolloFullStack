package com.shopcloud.catalogo.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ProductoRespuestaDTO {

    private Long id;

    private Long categoriaId;
    private String categoriaNombre;

    private String nombre;
    private String descripcion;
    private String sku;

    private BigDecimal precio;

    private Boolean activo;
    private Boolean destacado;

    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}