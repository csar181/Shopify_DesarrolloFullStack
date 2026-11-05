package com.shopcloud.plan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;

@Entity
@Table(name = "planes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    public static final String PERIODICIDAD_ANUAL = "ANUAL";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false, length = 20)
    private String periodicidad;

    @Column(name = "max_productos")
    private Integer maxProductos;

    @Column(name = "max_usuarios")
    private Integer maxUsuarios;

    @Column(name = "max_categorias")
    private Integer maxCategorias;

    @Column(name = "max_imagenes_producto")
    private Integer maxImagenesProducto;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> funcionalidades;

    @Column(nullable = false)
    private Boolean activo;
}
