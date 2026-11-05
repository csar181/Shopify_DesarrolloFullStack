package com.shopcloud.cliente.repository;

import com.shopcloud.cliente.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findByTiendaId(Long tiendaId);

    Optional<Cliente> findByIdAndTiendaId(Long clienteId, Long tiendaId);

    Optional<Cliente> findByTiendaIdAndCorreoElectronico(Long tiendaId, String correoElectronico);

    boolean existsByTiendaIdAndCorreoElectronico(Long tiendaId, String correoElectronico);
}
