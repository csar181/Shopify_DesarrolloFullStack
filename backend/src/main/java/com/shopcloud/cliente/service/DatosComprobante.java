package com.shopcloud.cliente.service;

import com.shopcloud.cliente.entity.DatosFacturacion;

/** Datos que se copian al pedido; datosFacturacion es null si no se guardaron. */
public record DatosComprobante(
        String tipoComprobante,
        String tipoDocumento,
        String numeroDocumento,
        String nombreRazonSocial,
        String direccionFiscal,
        DatosFacturacion datosFacturacion
) {
}
