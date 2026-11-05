package com.shopcloud.pedido.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PedidoDTO {

    private Long id;
    private String estado;
    private BigDecimal total;
    private String tipoComprobante;
    private String numeroComprobante;
    private Long clienteId;
    private String clienteNombre;
    private LocalDateTime creadoEn;
}
