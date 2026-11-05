package com.shopcloud.pago.dto;

import com.shopcloud.pago.entity.Transaccion;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class TransaccionDTO {

    private Long id;
    private Long pedidoId;
    private Long metodoPagoId;
    private String metodoPagoNombre;
    private BigDecimal monto;
    private String estado;
    private String referenciaTransaccion;
    private LocalDateTime creadoEn;

    public static TransaccionDTO desde(Transaccion transaccion) {
        return TransaccionDTO.builder()
                .id(transaccion.getId())
                .pedidoId(transaccion.getPedido().getId())
                .metodoPagoId(transaccion.getMetodoPago().getId())
                .metodoPagoNombre(transaccion.getMetodoPago().getNombre())
                .monto(transaccion.getMonto())
                .estado(transaccion.getEstado())
                .referenciaTransaccion(transaccion.getReferenciaTransaccion())
                .creadoEn(transaccion.getCreadoEn())
                .build();
    }
}
