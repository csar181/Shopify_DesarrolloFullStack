package com.shopcloud.pago.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Métodos manuales: transferencia, efectivo, Yape, Plin u otros que defina la tienda. */
@Getter
@Setter
public class GuardarMetodoPagoDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no puede superar los 50 caracteres")
    private String nombre;

    @NotBlank(message = "El tipo es obligatorio")
    @Size(max = 30, message = "El tipo no puede superar los 30 caracteres")
    private String tipo;

    private String instrucciones;

    private String datosPago;
}
