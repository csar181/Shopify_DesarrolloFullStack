package com.shopcloud.inventario.entity;

import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.entity.Variante;
import com.shopcloud.tienda.entity.Tienda;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variante_id")
    private Variante variante;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "cantidad_minima", nullable = false)
    private Integer cantidadMinima;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void prePersist() {
        if (cantidad == null) {
            cantidad = 0;
        }

        if (cantidadMinima == null) {
            cantidadMinima = 0;
        }

        actualizadoEn = LocalDateTime.now();
    }

    @PreUpdate
    protected void preUpdate() {
        actualizadoEn = LocalDateTime.now();
    }
}