package com.shopcloud.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AuthRespuestaDTO {

    private String token;
    private String tipo;
    private Long usuarioId;
    private String nombre;
    private String correoElectronico;
    private List<String> roles;
}