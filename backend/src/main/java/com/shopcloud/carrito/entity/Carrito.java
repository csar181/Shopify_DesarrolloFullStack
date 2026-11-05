package com.shopcloud.carrito.entity;

import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.tienda.entity.Tienda;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "carritos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Carrito {

    public static final String ESTADO_ACTIVO = "ACTIVO";
    public static final String ESTADO_CONVERTIDO = "CONVERTIDO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void prePersist() {
        LocalDateTime ahora = LocalDateTime.now();
        if (estado == null) estado = ESTADO_ACTIVO;
        if (total == null) total = BigDecimal.ZERO;
        if (creadoEn == null) creadoEn = ahora;
        actualizadoEn = ahora;
    }

    @PreUpdate
    protected void preUpdate() {
        actualizadoEn = LocalDateTime.now();
    }
}
