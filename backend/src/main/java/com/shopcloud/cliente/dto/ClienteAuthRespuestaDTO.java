package com.shopcloud.cliente.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClienteAuthRespuestaDTO {

    private String token;
    private String tipo;
    private Long clienteId;
    private Long tiendaId;
    private String tiendaSlug;
    private String nombre;
    private String correoElectronico;
}
