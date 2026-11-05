package com.shopcloud.catalogo.dto.publico;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class ProductoPublicoDTO {

    private Long id;
    private Long categoriaId;
    private String categoriaNombre;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Boolean destacado;
    private String urlImagenPrincipal;
    private List<String> imagenes;
    private List<VariantePublicaDTO> variantes;

    /** Stock general, o la suma de las variantes si se gestiona por variante. */
    private Integer stock;
}
