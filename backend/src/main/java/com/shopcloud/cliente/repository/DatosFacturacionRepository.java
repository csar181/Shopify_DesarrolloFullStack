package com.shopcloud.cliente.repository;

import com.shopcloud.cliente.entity.DatosFacturacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DatosFacturacionRepository extends JpaRepository<DatosFacturacion, Long> {

    List<DatosFacturacion> findByClienteIdOrderByActualizadoEnDesc(Long clienteId);

    Optional<DatosFacturacion> findByIdAndClienteId(Long id, Long clienteId);

    Optional<DatosFacturacion> findFirstByClienteIdAndTipoDocumentoAndNumeroDocumento(
            Long clienteId, String tipoDocumento, String numeroDocumento);
}
