package com.shopcloud.plan.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Builder
public class PlanRespuestaDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String periodicidad;
    private Integer maxProductos;
    private Integer maxUsuarios;
    private Integer maxCategorias;
    private Integer maxImagenesProducto;
    private Map<String, Object> funcionalidades;
    private Boolean activo;
}
