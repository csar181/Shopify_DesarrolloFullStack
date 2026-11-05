package com.shopcloud.catalogo.repository;

import com.shopcloud.catalogo.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository
        extends JpaRepository<Categoria, Long> {

    List<Categoria> findByTiendaIdAndActivoTrue(Long tiendaId);

    Optional<Categoria> findByIdAndTiendaId(
            Long categoriaId,
            Long tiendaId
    );

Optional<Categoria> findByIdAndTiendaIdAndActivoTrue(
        Long categoriaId,
        Long tiendaId
);

    long countByTiendaIdAndActivoTrue(Long tiendaId);

    boolean existsByNombreIgnoreCaseAndTiendaId(
            String nombre,
            Long tiendaId
    );

    boolean existsByNombreIgnoreCaseAndTiendaIdAndIdNot(
        String nombre,
        Long tiendaId,
        Long id
);
}