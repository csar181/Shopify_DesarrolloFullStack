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
public class CrearProductoDTO {

    private Long categoriaId;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150,
          message = "El nombre no puede superar los 150 caracteres")
    private String nombre;

    private String descripcion;

    @Size(max = 100,
          message = "El SKU no puede superar los 100 caracteres")
    private String sku;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(
            value = "0.00",
            inclusive = true,
            message = "El precio no puede ser negativo"
    )
    private BigDecimal precio;

    private Boolean destacado;
}