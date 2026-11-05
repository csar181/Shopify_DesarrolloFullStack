package com.shopcloud.catalogo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ImagenProductoRespuestaDTO {

    private Long id;
    private Long productoId;
    private String urlImagen;
    private Boolean esPrincipal;
}