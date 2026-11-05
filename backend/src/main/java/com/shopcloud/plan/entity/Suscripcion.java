package com.shopcloud.plan.entity;

import com.shopcloud.tienda.entity.Tienda;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * tipo indica qué es la suscripción (prueba o pagada) y estado, su situación.
 * Cada pago es una fila propia: monto_pagado y pagado_en no se sobrescriben.
 */
@Entity
@Table(name = "suscripciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Suscripcion {

    public static final String ESTADO_ACTIVA = "ACTIVA";
    public static final String ESTADO_VENCIDA = "VENCIDA";
    public static final String ESTADO_CANCELADA = "CANCELADA";

    public static final String TIPO_PRUEBA = "PRUEBA";
    public static final String TIPO_PAGADA = "PAGADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Column(name = "monto_pagado", precision = 10, scale = 2)
    private BigDecimal montoPagado;

    @Column(name = "pagado_en")
    private LocalDateTime pagadoEn;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    protected void prePersist() {
        if (creadoEn == null) {
            creadoEn = LocalDateTime.now();
        }
    }

    /** Solo cuenta si está ACTIVA y la fecha actual es anterior a fecha_fin. */
    public boolean estaVigente(LocalDateTime ahora) {
        return ESTADO_ACTIVA.equals(estado)
                && !fechaInicio.isAfter(ahora)
                && ahora.isBefore(fechaFin);
    }

    public boolean esPagada() {
        return TIPO_PAGADA.equals(tipo);
    }
}
