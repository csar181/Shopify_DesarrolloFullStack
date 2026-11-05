package com.shopcloud.descuento.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ActualizarDescuentoDTO {

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 50)
    private String codigo;

    @NotBlank(message = "El tipo es obligatorio")
    private String tipo;

    @NotNull(message = "El valor es obligatorio")
    @DecimalMin(
            value = "0.00",
            inclusive = false,
            message = "El valor debe ser mayor que cero"
    )
    private BigDecimal valor;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDateTime fechaInicio;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDateTime fechaFin;
}