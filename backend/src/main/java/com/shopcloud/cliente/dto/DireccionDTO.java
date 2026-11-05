package com.shopcloud.cliente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DireccionDTO {

    private Long id;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 255)
    private String lineaDireccion;

    @NotBlank(message = "La ciudad es obligatoria")
    @Size(max = 100)
    private String ciudad;

    @Size(max = 100)
    private String distrito;

    @Size(max = 100)
    private String departamento;

    @Size(max = 20)
    private String codigoPostal;

    @Size(max = 255)
    private String referencia;
}