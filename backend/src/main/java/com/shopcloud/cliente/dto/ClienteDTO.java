package com.shopcloud.cliente.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteDTO {

    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(
            max = 150,
            message = "El nombre no puede superar los 150 caracteres"
    )
    private String nombre;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no es válido")
    @Size(
            max = 150,
            message = "El correo electrónico no puede superar los 150 caracteres"
    )
    private String correoElectronico;

    @Size(
            max = 30,
            message = "El teléfono no puede superar los 30 caracteres"
    )
    private String telefono;
}