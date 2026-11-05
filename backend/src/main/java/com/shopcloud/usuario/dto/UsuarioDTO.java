package com.shopcloud.usuario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class UsuarioDTO {

    private Long id;
    private String nombre;
    private String correoElectronico;
    private Boolean activo;
    private List<String> roles;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}