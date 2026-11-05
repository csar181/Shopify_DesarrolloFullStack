package com.shopcloud.carrito.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AgregarProductoDTO {
    @NotNull(message = "El producto es obligatorio")
    private Long productoId;
    private Long varianteId;
    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser mayor que cero")
    private Integer cantidad;
}
