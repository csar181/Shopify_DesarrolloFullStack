package com.shopcloud.catalogo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ActualizarProductoDTO {

    private Long categoriaId;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150)
    private String nombre;

    private String descripcion;

    @Size(max = 100)
    private String sku;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.00")
    private BigDecimal precio;

    private Boolean destacado;
}