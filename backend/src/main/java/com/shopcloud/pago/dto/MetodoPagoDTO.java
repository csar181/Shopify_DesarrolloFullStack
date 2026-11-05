package com.shopcloud.pago.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MetodoPagoDTO {

    private Long id;
    private String nombre;
    private String tipo;
    private String instrucciones;
    private String datosPago;
    private Boolean activo;
    private LocalDateTime creadoEn;
}
