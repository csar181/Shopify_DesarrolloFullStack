package com.shopcloud.catalogo.service;

import com.shopcloud.catalogo.dto.VarianteDTO;
import com.shopcloud.catalogo.dto.VarianteRespuestaDTO;

import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.entity.Variante;

import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.catalogo.repository.VarianteRepository;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;

import com.shopcloud.inventario.repository.InventarioRepository;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VarianteService {

    private final VarianteRepository varianteRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final TenantService tenantService;
    @Transactional
    public VarianteRespuestaDTO crear(
            Long productoId,
            VarianteDTO dto
    ) {

        Producto producto = productoRepository
                .findWithLockByIdAndTiendaId(productoId, tenantService.obtenerTenantId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado"));

        if (inventarioRepository.existsByProductoIdAndVarianteIsNull(productoId)) {
            throw new ReglaNegocioException(
                    "El producto gestiona su inventario de forma general. "
                            + "Elimine ese inventario antes de agregar variantes");
        }
        validarSkuCrear(
                productoId,
                dto.getSku()
        );

        Variante variante =
                Variante.builder()
                        .producto(producto)
                        .nombre(dto.getNombre().trim())
                        .sku(normalizarSku(dto.getSku()))
                        .precio(dto.getPrecio())
                        .activo(true)
                        .build();

        return convertirDTO(
                varianteRepository.save(variante)
        );
    }

    @Transactional(readOnly = true)
    public List<VarianteRespuestaDTO> listar(
            Long productoId
    ) {

        buscarProducto(productoId);

        return varianteRepository
                .findByProductoIdAndActivoTrue(
                        productoId
                )
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public VarianteRespuestaDTO obtener(
            Long productoId,
            Long varianteId
    ) {

        buscarProducto(productoId);

        return convertirDTO(
                buscarVariante(
                        varianteId,
                        productoId
                )
        );
    }

    @Transactional
    public VarianteRespuestaDTO actualizar(
            Long productoId,
            Long varianteId,
            VarianteDTO dto
    ) {

        buscarProducto(productoId);

        Variante variante =
                buscarVariante(
                        varianteId,
                        productoId
                );

        validarSkuActualizar(
                productoId,
                varianteId,
                dto.getSku()
        );

        variante.setNombre(
                dto.getNombre().trim()
        );
        variante.setSku(
                normalizarSku(dto.getSku())
        );
        variante.setPrecio(
                dto.getPrecio()
        );

        return convertirDTO(
                varianteRepository.save(variante)
        );
    }

    @Transactional
    public void eliminar(
            Long productoId,
            Long varianteId
    ) {

        buscarProducto(productoId);

        Variante variante =
                buscarVariante(
                        varianteId,
                        productoId
                );

        variante.setActivo(false);

        varianteRepository.save(variante);
    }

    private Producto buscarProducto(
            Long productoId
    ) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return productoRepository
                .findByIdAndTiendaId(
                        productoId,
                        tiendaId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Producto no encontrado"
                        )
                );
    }

    private Variante buscarVariante(
            Long varianteId,
            Long productoId
    ) {

        return varianteRepository
                .findByIdAndProductoId(
                        varianteId,
                        productoId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Variante no encontrada"
                        )
                );
    }

    private void validarSkuCrear(
            Long productoId,
            String sku
    ) {

        String skuNormalizado =
                normalizarSku(sku);

        if (skuNormalizado == null) {
            return;
        }

        if (varianteRepository
                .existsByProductoIdAndSkuIgnoreCase(
                        productoId,
                        skuNormalizado
                )) {

            throw new ReglaNegocioException(
                    "Ya existe una variante con ese SKU"
            );
        }
    }

    private void validarSkuActualizar(
            Long productoId,
            Long varianteId,
            String sku
    ) {

        String skuNormalizado =
                normalizarSku(sku);

        if (skuNormalizado == null) {
            return;
        }

        if (varianteRepository
                .existsByProductoIdAndSkuIgnoreCaseAndIdNot(
                        productoId,
                        skuNormalizado,
                        varianteId
                )) {

            throw new ReglaNegocioException(
                    "Ya existe otra variante con ese SKU"
            );
        }
    }

    private String normalizarSku(String sku) {

        if (sku == null || sku.isBlank()) {
            return null;
        }

        return sku.trim();
    }

    private VarianteRespuestaDTO convertirDTO(
            Variante variante
    ) {

        return VarianteRespuestaDTO.builder()
                .id(variante.getId())
                .productoId(
                        variante.getProducto().getId()
                )
                .nombre(variante.getNombre())
                .sku(variante.getSku())
                .precio(variante.getPrecio())
                .activo(variante.getActivo())
                .build();
    }
}