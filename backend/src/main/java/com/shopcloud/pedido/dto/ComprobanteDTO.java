package com.shopcloud.pedido.dto;

import lombok.Builder;
import lombok.Getter;

/** Comprobante simulado: no se emite ante SUNAT. */
@Getter
@Builder
public class ComprobanteDTO {

    private String tipo;
    private String numero;
    private String estado;
    private String tipoDocumento;
    private String numeroDocumento;
    private String nombreRazonSocial;
    private String direccionFiscal;
}
