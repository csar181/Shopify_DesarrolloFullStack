package com.shopcloud.carrito.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** Carrito armado en el navegador antes de iniciar sesión. No incluye precios. */
@Getter
@Setter
public class SincronizarCarritoDTO {

    @NotNull(message = "Los elementos son obligatorios")
    private List<@Valid AgregarProductoDTO> elementos;
}
