package com.shopcloud.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistroDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    private String nombre;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Ingrese un correo electrónico válido")
    @Size(max = 150)
    private String correoElectronico;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(
        min = 8,
        max = 100,
        message = "La contraseña debe tener entre 8 y 100 caracteres"
    )
    private String contrasena;
}