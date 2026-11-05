package com.shopcloud.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class UsuarioRespuestaDTO {

    private Long id;
    private String nombre;
    private String correoElectronico;
    private Boolean activo;
    private List<String> roles;
}