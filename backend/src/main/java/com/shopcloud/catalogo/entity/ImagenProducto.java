package com.shopcloud.catalogo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "imagenes_producto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImagenProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "url_imagen", nullable = false, length = 500)
    private String urlImagen;

    @Column(name = "es_principal", nullable = false)
    private Boolean esPrincipal;

    @PrePersist
    protected void prePersist() {
        if (esPrincipal == null) {
            esPrincipal = false;
        }
    }
}