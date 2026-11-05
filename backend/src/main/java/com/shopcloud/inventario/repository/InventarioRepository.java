package com.shopcloud.inventario.repository;

import com.shopcloud.inventario.entity.Inventario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    List<Inventario> findByTiendaId(Long tiendaId);

    List<Inventario> findByProductoId(Long productoId);

    Optional<Inventario> findByIdAndTiendaId(Long id, Long tiendaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Inventario> findWithLockByIdAndTiendaId(Long id, Long tiendaId);

    boolean existsByProductoIdAndVarianteIsNull(Long productoId);

    boolean existsByProductoIdAndVarianteIsNotNull(Long productoId);

    boolean existsByProductoIdAndVarianteId(Long productoId, Long varianteId);

    Optional<Inventario> findByTiendaIdAndProductoIdAndVarianteIsNull(Long tiendaId, Long productoId);

    Optional<Inventario> findByTiendaIdAndProductoIdAndVarianteId(
            Long tiendaId, Long productoId, Long varianteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Inventario> findWithLockByTiendaIdAndProductoIdAndVarianteIsNull(
            Long tiendaId, Long productoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Inventario> findWithLockByTiendaIdAndProductoIdAndVarianteId(
            Long tiendaId, Long productoId, Long varianteId);
}
