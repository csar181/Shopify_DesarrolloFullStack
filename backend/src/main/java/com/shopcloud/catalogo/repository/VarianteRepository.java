package com.shopcloud.catalogo.repository;

import com.shopcloud.catalogo.entity.Variante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VarianteRepository
        extends JpaRepository<Variante, Long> {

    List<Variante> findByProductoIdAndActivoTrue(
            Long productoId
    );

    Optional<Variante> findByIdAndProductoId(
            Long id,
            Long productoId
    );

    Optional<Variante> findByIdAndProductoIdAndActivoTrue(
            Long id,
            Long productoId
    );

    boolean existsByProductoIdAndSkuIgnoreCase(
            Long productoId,
            String sku
    );

    boolean existsByProductoIdAndSkuIgnoreCaseAndIdNot(
            Long productoId,
            String sku,
            Long varianteId
    );
}
