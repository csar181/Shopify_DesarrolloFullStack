package com.shopcloud.cliente.repository;

import com.shopcloud.cliente.entity.Direccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DireccionRepository extends JpaRepository<Direccion, Long> {

    List<Direccion> findByClienteId(Long clienteId);

    Optional<Direccion> findByIdAndClienteId(Long direccionId, Long clienteId);
}
