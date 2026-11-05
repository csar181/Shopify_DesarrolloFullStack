package com.shopcloud.catalogo.repository;

import com.shopcloud.catalogo.entity.Producto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByTiendaIdAndActivoTrue(Long tiendaId);

    List<Producto> findByTiendaIdAndCategoriaIdAndActivoTrue(Long tiendaId, Long categoriaId);

    Optional<Producto> findByIdAndTiendaId(Long productoId, Long tiendaId);

    Optional<Producto> findByIdAndTiendaIdAndActivoTrue(Long productoId, Long tiendaId);

    /** Serializa los cambios en la forma de gestionar el inventario del producto. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Producto> findWithLockByIdAndTiendaId(Long productoId, Long tiendaId);

    long countByTiendaIdAndActivoTrue(Long tiendaId);

    boolean existsByTiendaIdAndSkuIgnoreCase(Long tiendaId, String sku);

    boolean existsByTiendaIdAndSkuIgnoreCaseAndIdNot(Long tiendaId, String sku, Long productoId);
}
