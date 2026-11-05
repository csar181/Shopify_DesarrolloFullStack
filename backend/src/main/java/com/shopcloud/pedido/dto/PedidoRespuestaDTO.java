package com.shopcloud.pedido.dto;

import com.shopcloud.pago.dto.TransaccionDTO;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PedidoRespuestaDTO {

    private Long id;
    private String estado;
    private Long clienteId;
    private String clienteNombre;

    private BigDecimal subtotal;
    private String codigoDescuento;
    private String tipoDescuento;
    private BigDecimal valorDescuento;
    private BigDecimal montoDescuento;
    private BigDecimal baseImponible;
    private BigDecimal porcentajeIgv;
    private BigDecimal montoIgv;
    private BigDecimal total;

    private String lineaDireccion;
    private String ciudad;
    private String distrito;
    private String departamento;
    private String codigoPostal;
    private String referencia;

    private ComprobanteDTO comprobante;
    private TransaccionDTO transaccion;
    private List<ElementoPedidoDTO> elementos;

    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
