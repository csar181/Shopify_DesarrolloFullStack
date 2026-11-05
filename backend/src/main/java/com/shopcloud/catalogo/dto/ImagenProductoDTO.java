package com.shopcloud.catalogo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImagenProductoDTO {

    @NotBlank(message = "La URL de la imagen es obligatoria")
    @Size(
        max = 500,
        message = "La URL no puede superar los 500 caracteres"
    )
    private String urlImagen;

    private Boolean esPrincipal;
}