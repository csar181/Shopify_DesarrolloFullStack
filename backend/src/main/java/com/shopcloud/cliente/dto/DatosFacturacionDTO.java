package com.shopcloud.cliente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatosFacturacionDTO {

    private Long id;

    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 20, message = "El número de documento no puede superar los 20 caracteres")
    private String numeroDocumento;

    @NotBlank(message = "El nombre o razón social es obligatorio")
    @Size(max = 150, message = "El nombre o razón social no puede superar los 150 caracteres")
    private String nombreRazonSocial;

    @Size(max = 255, message = "La dirección fiscal no puede superar los 255 caracteres")
    private String direccionFiscal;
}
