package com.shopcloud.usuario.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(
        name = "correo_electronico",
        nullable = false,
        unique = true,
        length = 150
    )
    private String correoElectronico;

    @Column(nullable = false, length = 255)
    private String contrasena;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    public void prePersist() {
        LocalDateTime ahora = LocalDateTime.now();

        if (creadoEn == null) {
            creadoEn = ahora;
        }

        actualizadoEn = ahora;

        if (activo == null) {
            activo = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        actualizadoEn = LocalDateTime.now();
    }
}