package com.shopcloud.catalogo.repository;

import com.shopcloud.catalogo.entity.ImagenProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImagenProductoRepository
        extends JpaRepository<ImagenProducto, Long> {

    List<ImagenProducto> findByProductoId(Long productoId);

    long countByProductoId(Long productoId);

    Optional<ImagenProducto> findByIdAndProductoId(
            Long id,
            Long productoId
    );

    Optional<ImagenProducto>
    findByProductoIdAndEsPrincipalTrue(Long productoId);
}