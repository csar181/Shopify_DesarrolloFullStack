package com.shopcloud.catalogo.dto.publico;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TiendaPublicaDTO {

    private Long id;
    private String nombre;
    private String slug;
    private String descripcion;
    private String urlLogo;
    private String urlBanner;
    private String colorPrimario;
    private String correoContacto;
    private String telefonoContacto;
}
