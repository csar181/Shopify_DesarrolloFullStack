package com.shopcloud.pedido.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActualizarEstadoPedidoDTO {

    @NotBlank(message = "El estado es obligatorio")
    private String estado;
}
