package com.shopcloud.pago.service;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.pago.dto.GuardarMetodoPagoDTO;
import com.shopcloud.pago.dto.MetodoPagoDTO;
import com.shopcloud.pago.entity.MetodoPago;
import com.shopcloud.pago.repository.MetodoPagoRepository;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Gestión del propietario. Las transacciones históricas impiden el borrado físico. */
@Service
@RequiredArgsConstructor
public class MetodoPagoService {

    private final MetodoPagoRepository metodoPagoRepository;
    private final TenantService tenantService;

    @Transactional
    public MetodoPagoDTO crear(GuardarMetodoPagoDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();
        String nombre = dto.getNombre().trim();

        if (metodoPagoRepository.existsByTiendaIdAndNombreIgnoreCase(tiendaId, nombre)) {
            throw new ReglaNegocioException("Ya existe un método de pago con ese nombre");
        }

        return convertirDTO(metodoPagoRepository.save(
                MetodoPago.builder()
                        .tienda(tenantService.obtenerTiendaActual())
                        .nombre(nombre)
                        .tipo(dto.getTipo().trim().toUpperCase())
                        .instrucciones(dto.getInstrucciones())
                        .datosPago(dto.getDatosPago())
                        .activo(true)
                        .build()
        ));
    }

    @Transactional(readOnly = true)
    public List<MetodoPagoDTO> listar() {
        return metodoPagoRepository.findByTiendaIdOrderByNombre(tenantService.obtenerTenantId())
                .stream()
                .map(MetodoPagoService::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public MetodoPagoDTO obtener(Long id) {
        return convertirDTO(buscar(id));
    }

    @Transactional
    public MetodoPagoDTO actualizar(Long id, GuardarMetodoPagoDTO dto) {
        MetodoPago metodo = buscar(id);
        String nombre = dto.getNombre().trim();

        if (metodoPagoRepository.existsByTiendaIdAndNombreIgnoreCaseAndIdNot(
                tenantService.obtenerTenantId(), nombre, id)) {
            throw new ReglaNegocioException("Ya existe un método de pago con ese nombre");
        }

        metodo.setNombre(nombre);
        metodo.setTipo(dto.getTipo().trim().toUpperCase());
        metodo.setInstrucciones(dto.getInstrucciones());
        metodo.setDatosPago(dto.getDatosPago());

        return convertirDTO(metodoPagoRepository.save(metodo));
    }

    @Transactional
    public void desactivar(Long id) {
        MetodoPago metodo = buscar(id);
        metodo.setActivo(false);
        metodoPagoRepository.save(metodo);
    }

    @Transactional
    public MetodoPagoDTO activar(Long id) {
        MetodoPago metodo = buscar(id);
        metodo.setActivo(true);
        return convertirDTO(metodoPagoRepository.save(metodo));
    }

    private MetodoPago buscar(Long id) {
        return metodoPagoRepository.findByIdAndTiendaId(id, tenantService.obtenerTenantId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Método de pago no encontrado"));
    }

    static MetodoPagoDTO convertirDTO(MetodoPago metodo) {
        return MetodoPagoDTO.builder()
                .id(metodo.getId())
                .nombre(metodo.getNombre())
                .tipo(metodo.getTipo())
                .instrucciones(metodo.getInstrucciones())
                .datosPago(metodo.getDatosPago())
                .activo(metodo.getActivo())
                .creadoEn(metodo.getCreadoEn())
                .build();
    }
}
