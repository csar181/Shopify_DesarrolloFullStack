package com.shopcloud.carrito.repository;

import com.shopcloud.carrito.entity.ElementoCarrito;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ElementoCarritoRepository extends JpaRepository<ElementoCarrito, Long> {
    List<ElementoCarrito> findByCarritoIdOrderById(Long carritoId);
    Optional<ElementoCarrito> findByIdAndCarritoId(Long elementoId, Long carritoId);
    Optional<ElementoCarrito> findByCarritoIdAndProductoIdAndVarianteIsNull(
            Long carritoId, Long productoId);
    Optional<ElementoCarrito> findByCarritoIdAndProductoIdAndVarianteId(
            Long carritoId, Long productoId, Long varianteId);
    void deleteByCarritoId(Long carritoId);
}
