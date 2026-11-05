package com.shopcloud.catalogo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class VarianteDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    private String nombre;

    @Size(max = 100)
    private String sku;

    @DecimalMin(
        value = "0.00",
        message = "El precio no puede ser negativo"
    )
    private BigDecimal precio;
}