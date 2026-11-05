package com.shopcloud.catalogo.service;

import com.shopcloud.catalogo.dto.ActualizarProductoDTO;
import com.shopcloud.catalogo.dto.CrearProductoDTO;
import com.shopcloud.catalogo.dto.ProductoRespuestaDTO;

import com.shopcloud.catalogo.entity.Categoria;
import com.shopcloud.catalogo.entity.Producto;

import com.shopcloud.catalogo.repository.CategoriaRepository;
import com.shopcloud.catalogo.repository.ProductoRepository;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;

import com.shopcloud.plan.service.LimitesPlanService;
import com.shopcloud.tenant.TenantService;
import com.shopcloud.tienda.entity.Tienda;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final TenantService tenantService;
    private final LimitesPlanService limitesPlanService;
    @Transactional
    public ProductoRespuestaDTO crear(
            CrearProductoDTO dto
    ) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        limitesPlanService.verificarCupoProductos(tiendaId);

        validarSkuCrear(dto.getSku(), tiendaId);
        Categoria categoria =
                obtenerCategoria(
                        dto.getCategoriaId(),
                        tiendaId
                );

        Tienda tienda =
                tenantService.obtenerTiendaActual();

        Producto producto =
                Producto.builder()
                        .tienda(tienda)
                        .categoria(categoria)
                        .nombre(dto.getNombre().trim())
                        .descripcion(dto.getDescripcion())
                        .sku(normalizarSku(dto.getSku()))
                        .precio(dto.getPrecio())
                        .activo(true)
                        .destacado(
                                Boolean.TRUE.equals(
                                        dto.getDestacado()
                                )
                        )
                        .build();

        return convertirDTO(
                productoRepository.save(producto)
        );
    }

    @Transactional(readOnly = true)
    public List<ProductoRespuestaDTO> listar() {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return productoRepository
                .findByTiendaIdAndActivoTrue(tiendaId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoRespuestaDTO obtener(Long id) {

        return convertirDTO(
                buscarProducto(id)
        );
    }

    @Transactional
    public ProductoRespuestaDTO actualizar(
            Long id,
            ActualizarProductoDTO dto
    ) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        Producto producto =
                buscarProducto(id);

        validarSkuActualizar(
                dto.getSku(),
                tiendaId,
                id
        );

        Categoria categoria =
                obtenerCategoria(
                        dto.getCategoriaId(),
                        tiendaId
                );

        producto.setCategoria(categoria);
        producto.setNombre(dto.getNombre().trim());
        producto.setDescripcion(dto.getDescripcion());
        producto.setSku(normalizarSku(dto.getSku()));
        producto.setPrecio(dto.getPrecio());

        if (dto.getDestacado() != null) {
            producto.setDestacado(
                    dto.getDestacado()
            );
        }

        return convertirDTO(
                productoRepository.save(producto)
        );
    }

    @Transactional
    public void eliminar(Long id) {

        Producto producto =
                buscarProducto(id);

        producto.setActivo(false);

        productoRepository.save(producto);
    }

    @Transactional
    public ProductoRespuestaDTO activar(Long id) {
        Producto producto = buscarProducto(id);

        if (!Boolean.TRUE.equals(producto.getActivo())) {
            limitesPlanService.verificarCupoProductos(tenantService.obtenerTenantId());
            producto.setActivo(true);
        }

        return convertirDTO(productoRepository.save(producto));
    }

    private Producto buscarProducto(Long id) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return productoRepository
                .findByIdAndTiendaId(
                        id,
                        tiendaId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Producto no encontrado"
                        )
                );
    }

    private Categoria obtenerCategoria(
            Long categoriaId,
            Long tiendaId
    ) {

        if (categoriaId == null) {
            return null;
        }

        return categoriaRepository
                .findByIdAndTiendaIdAndActivoTrue(
                        categoriaId,
                        tiendaId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Categoría activa no encontrada"
                        )
                );
    }

    private void validarSkuCrear(
            String sku,
            Long tiendaId
    ) {

        String skuNormalizado =
                normalizarSku(sku);

        if (skuNormalizado == null) {
            return;
        }

        if (productoRepository
                .existsByTiendaIdAndSkuIgnoreCase(
                        tiendaId,
                        skuNormalizado
                )) {

            throw new ReglaNegocioException(
                    "Ya existe un producto con ese SKU"
            );
        }
    }

    private void validarSkuActualizar(
            String sku,
            Long tiendaId,
            Long productoId
    ) {

        String skuNormalizado =
                normalizarSku(sku);

        if (skuNormalizado == null) {
            return;
        }

        if (productoRepository
                .existsByTiendaIdAndSkuIgnoreCaseAndIdNot(
                        tiendaId,
                        skuNormalizado,
                        productoId
                )) {

            throw new ReglaNegocioException(
                    "Ya existe otro producto con ese SKU"
            );
        }
    }

    private String normalizarSku(String sku) {

        if (sku == null || sku.isBlank()) {
            return null;
        }

        return sku.trim();
    }

    private ProductoRespuestaDTO convertirDTO(
            Producto producto
    ) {

        Categoria categoria =
                producto.getCategoria();

        return ProductoRespuestaDTO.builder()
                .id(producto.getId())
                .categoriaId(
                        categoria != null
                                ? categoria.getId()
                                : null
                )
                .categoriaNombre(
                        categoria != null
                                ? categoria.getNombre()
                                : null
                )
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .sku(producto.getSku())
                .precio(producto.getPrecio())
                .activo(producto.getActivo())
                .destacado(producto.getDestacado())
                .creadoEn(producto.getCreadoEn())
                .actualizadoEn(
                        producto.getActualizadoEn()
                )
                .build();
    }
}