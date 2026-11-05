package com.shopcloud.inventario.service;

import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.entity.Variante;
import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.catalogo.repository.VarianteRepository;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.inventario.dto.ActualizarInventarioDTO;
import com.shopcloud.inventario.dto.CrearInventarioDTO;
import com.shopcloud.inventario.dto.InventarioRespuestaDTO;
import com.shopcloud.inventario.entity.Inventario;
import com.shopcloud.inventario.repository.InventarioRepository;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
    private final VarianteRepository varianteRepository;
    private final TenantService tenantService;

    @Transactional
    public InventarioRespuestaDTO crear(CrearInventarioDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();

        // El bloqueo evita crear a la vez stock general y stock por variante.
        Producto producto = productoRepository
                .findWithLockByIdAndTiendaId(dto.getProductoId(), tiendaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado"));

        Variante variante = obtenerVariante(producto, dto.getVarianteId());
        validarFormaDeGestion(producto.getId(), variante);

        return convertirDTO(inventarioRepository.save(
                Inventario.builder()
                        .tienda(tenantService.obtenerTiendaActual())
                        .producto(producto)
                        .variante(variante)
                        .cantidad(dto.getCantidad())
                        .cantidadMinima(dto.getCantidadMinima())
                        .build()
        ));
    }

    @Transactional(readOnly = true)
    public List<InventarioRespuestaDTO> listar() {
        return inventarioRepository.findByTiendaId(tenantService.obtenerTenantId())
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventarioRespuestaDTO obtener(Long id) {
        return convertirDTO(
                inventarioRepository.findByIdAndTiendaId(id, tenantService.obtenerTenantId())
                        .orElseThrow(this::noEncontrado)
        );
    }

    @Transactional
    public InventarioRespuestaDTO actualizar(Long id, ActualizarInventarioDTO dto) {
        Inventario inventario = buscarBloqueado(id);
        inventario.setCantidad(dto.getCantidad());
        inventario.setCantidadMinima(dto.getCantidadMinima());
        return convertirDTO(inventarioRepository.save(inventario));
    }

    /** Permite cambiar entre stock general y por variantes una vez que el stock es cero. */
    @Transactional
    public void eliminar(Long id) {
        Inventario inventario = buscarBloqueado(id);
        if (inventario.getCantidad() > 0) {
            throw new ReglaNegocioException(
                    "Solo se puede eliminar un registro de inventario con stock cero");
        }
        inventarioRepository.delete(inventario);
    }

    @Transactional(readOnly = true)
    public List<InventarioRespuestaDTO> listarStockBajo() {
        return inventarioRepository.findByTiendaId(tenantService.obtenerTenantId())
                .stream()
                .filter(inventario -> inventario.getCantidad() <= inventario.getCantidadMinima())
                .map(this::convertirDTO)
                .toList();
    }

    private Inventario buscarBloqueado(Long id) {
        return inventarioRepository
                .findWithLockByIdAndTiendaId(id, tenantService.obtenerTenantId())
                .orElseThrow(this::noEncontrado);
    }

    private RecursoNoEncontradoException noEncontrado() {
        return new RecursoNoEncontradoException("Registro de inventario no encontrado");
    }

    private Variante obtenerVariante(Producto producto, Long varianteId) {
        if (varianteId == null) {
            return null;
        }
        return varianteRepository.findByIdAndProductoId(varianteId, producto.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "La variante no pertenece al producto"));
    }

    /** Un producto usa stock general o stock por variantes, nunca ambos. */
    private void validarFormaDeGestion(Long productoId, Variante variante) {
        if (variante == null) {
            if (inventarioRepository.existsByProductoIdAndVarianteIsNotNull(productoId)) {
                throw new ReglaNegocioException(
                        "El producto ya gestiona su inventario por variantes");
            }
            if (inventarioRepository.existsByProductoIdAndVarianteIsNull(productoId)) {
                throw new ReglaNegocioException(
                        "Ya existe el inventario general de este producto");
            }
            return;
        }

        if (inventarioRepository.existsByProductoIdAndVarianteIsNull(productoId)) {
            throw new ReglaNegocioException(
                    "El producto ya gestiona su inventario de forma general");
        }
        if (inventarioRepository.existsByProductoIdAndVarianteId(productoId, variante.getId())) {
            throw new ReglaNegocioException("Ya existe el inventario de esta variante");
        }
    }

    private InventarioRespuestaDTO convertirDTO(Inventario inventario) {
        Variante variante = inventario.getVariante();

        return InventarioRespuestaDTO.builder()
                .id(inventario.getId())
                .productoId(inventario.getProducto().getId())
                .productoNombre(inventario.getProducto().getNombre())
                .varianteId(variante != null ? variante.getId() : null)
                .varianteNombre(variante != null ? variante.getNombre() : null)
                .cantidad(inventario.getCantidad())
                .cantidadMinima(inventario.getCantidadMinima())
                .stockBajo(inventario.getCantidad() <= inventario.getCantidadMinima())
                .actualizadoEn(inventario.getActualizadoEn())
                .build();
    }
}
