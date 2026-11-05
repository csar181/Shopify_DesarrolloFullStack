package com.shopcloud.pedido.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Los productos, precios y totales salen del carrito y del catálogo, no de esta petición.
 * Para el comprobante se envía datosFacturacionId, o bien número de documento y nombre.
 */
@Getter
@Setter
public class CheckoutDTO {

    @NotNull(message = "La dirección es obligatoria")
    @Positive(message = "El ID de la dirección debe ser válido")
    private Long direccionId;

    @NotNull(message = "El método de pago es obligatorio")
    @Positive(message = "El ID del método de pago debe ser válido")
    private Long metodoPagoId;

    @Size(max = 50, message = "El código de descuento no puede superar los 50 caracteres")
    private String codigoDescuento;

    /** BOLETA (por defecto) o FACTURA. */
    private String tipoComprobante;

    @Positive(message = "El ID de los datos de facturación debe ser válido")
    private Long datosFacturacionId;

    @Size(max = 20, message = "El número de documento no puede superar los 20 caracteres")
    private String numeroDocumento;

    @Size(max = 150, message = "El nombre o razón social no puede superar los 150 caracteres")
    private String nombreRazonSocial;

    @Size(max = 255, message = "La dirección fiscal no puede superar los 255 caracteres")
    private String direccionFiscal;

    /** Por defecto los datos nuevos se guardan para futuras compras. */
    private Boolean guardarDatosFacturacion;
}
