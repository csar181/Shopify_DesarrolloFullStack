package com.shopcloud.catalogo.dto.publico;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoriaPublicaDTO {

    private Long id;
    private String nombre;
    private String descripcion;
}
