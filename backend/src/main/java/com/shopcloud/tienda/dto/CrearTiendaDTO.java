package com.shopcloud.tienda.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearTiendaDTO {

    /** Plan elegido para los 7 días de prueba gratuita. */
    @NotNull(message = "El plan es obligatorio")
    private Long planId;

    @NotBlank(message = "El nombre de la tienda es obligatorio")
    @Size(max = 150)
    private String nombre;

    @Size(max = 100)
    private String slug;

    private String descripcion;

    @Size(max = 500)
    private String urlLogo;

    @Size(max = 500)
    private String urlBanner;

    @Size(max = 20)
    private String colorPrimario;

    @Email(message = "El correo de contacto no es válido")
    @Size(max = 150)
    private String correoContacto;

    @Size(max = 30)
    private String telefonoContacto;
}