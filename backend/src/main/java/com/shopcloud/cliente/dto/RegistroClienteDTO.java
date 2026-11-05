package com.shopcloud.cliente.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistroClienteDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String nombre;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Ingrese un correo electrónico válido")
    @Size(max = 150, message = "El correo electrónico no puede superar los 150 caracteres")
    private String correoElectronico;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
    private String contrasena;

    @Size(max = 30, message = "El teléfono no puede superar los 30 caracteres")
    private String telefono;
}
