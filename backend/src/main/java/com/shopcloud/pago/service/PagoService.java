package com.shopcloud.pago.service;

import com.shopcloud.cliente.service.ClienteService;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.pago.dto.MetodoPagoDTO;
import com.shopcloud.pago.dto.TransaccionDTO;
import com.shopcloud.pago.repository.MetodoPagoRepository;
import com.shopcloud.pago.repository.TransaccionRepository;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Consultas de pagos. El pago simulado se registra dentro del checkout. */
@Service
@RequiredArgsConstructor
public class PagoService {

    private final MetodoPagoRepository metodoPagoRepository;
    private final TransaccionRepository transaccionRepository;
    private final ClienteService clienteService;
    private final TenantService tenantService;

    @Transactional(readOnly = true)
    public List<MetodoPagoDTO> listarMetodosActivos() {
        return metodoPagoRepository
                .findByTiendaIdAndActivoTrueOrderByNombre(tenantService.obtenerTenantId())
                .stream()
                .map(MetodoPagoService::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransaccionDTO> listarTransaccionesPropias() {
        return transaccionRepository
                .findByPedidoClienteIdAndTiendaIdOrderByCreadoEnDesc(
                        clienteService.obtenerClienteActual().getId(),
                        tenantService.obtenerTenantId())
                .stream()
                .map(TransaccionDTO::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransaccionDTO obtenerTransaccionPropia(Long transaccionId) {
        return transaccionRepository
                .findByIdAndPedidoClienteIdAndTiendaId(
                        transaccionId,
                        clienteService.obtenerClienteActual().getId(),
                        tenantService.obtenerTenantId())
                .map(TransaccionDTO::desde)
                .orElseThrow(this::noEncontrada);
    }

    @Transactional(readOnly = true)
    public List<TransaccionDTO> listarTransaccionesDeLaTienda() {
        return transaccionRepository
                .findByTiendaIdOrderByCreadoEnDesc(tenantService.obtenerTenantId())
                .stream()
                .map(TransaccionDTO::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransaccionDTO obtenerTransaccionDeLaTienda(Long transaccionId) {
        return transaccionRepository
                .findByIdAndTiendaId(transaccionId, tenantService.obtenerTenantId())
                .map(TransaccionDTO::desde)
                .orElseThrow(this::noEncontrada);
    }

    private RecursoNoEncontradoException noEncontrada() {
        return new RecursoNoEncontradoException("Transacción no encontrada");
    }
}
