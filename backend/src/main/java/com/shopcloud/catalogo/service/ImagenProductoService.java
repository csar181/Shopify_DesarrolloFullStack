package com.shopcloud.catalogo.service;

import com.shopcloud.catalogo.dto.ImagenProductoDTO;
import com.shopcloud.catalogo.dto.ImagenProductoRespuestaDTO;
import com.shopcloud.catalogo.entity.ImagenProducto;
import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.repository.ImagenProductoRepository;
import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.plan.service.LimitesPlanService;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImagenProductoService {

    private final ImagenProductoRepository imagenRepository;
    private final ProductoRepository productoRepository;
    private final TenantService tenantService;
    private final LimitesPlanService limitesPlanService;
    @Transactional
    public ImagenProductoRespuestaDTO agregar(
            Long productoId,
            ImagenProductoDTO dto
    ) {

        Producto producto = buscarProducto(productoId);

        limitesPlanService.verificarCupoImagenes(
                tenantService.obtenerTenantId(), productoId);
        boolean principal =
                Boolean.TRUE.equals(dto.getEsPrincipal());

        if (principal) {
            quitarImagenPrincipal(productoId);
        }

        ImagenProducto imagen =
                ImagenProducto.builder()
                        .producto(producto)
                        .urlImagen(dto.getUrlImagen().trim())
                        .esPrincipal(principal)
                        .build();

        return convertirDTO(
                imagenRepository.save(imagen)
        );
    }

    @Transactional(readOnly = true)
    public List<ImagenProductoRespuestaDTO> listar(
            Long productoId
    ) {

        buscarProducto(productoId);

        return imagenRepository
                .findByProductoId(productoId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional
    public ImagenProductoRespuestaDTO actualizar(
            Long productoId,
            Long imagenId,
            ImagenProductoDTO dto
    ) {

        buscarProducto(productoId);

        ImagenProducto imagen =
                buscarImagen(imagenId, productoId);

        boolean principal =
                Boolean.TRUE.equals(dto.getEsPrincipal());

        if (principal) {
            quitarImagenPrincipal(productoId);
        }

        imagen.setUrlImagen(
                dto.getUrlImagen().trim()
        );
        imagen.setEsPrincipal(principal);

        return convertirDTO(
                imagenRepository.save(imagen)
        );
    }

    @Transactional
    public void eliminar(
            Long productoId,
            Long imagenId
    ) {

        buscarProducto(productoId);

        ImagenProducto imagen =
                buscarImagen(imagenId, productoId);

        imagenRepository.delete(imagen);
    }

    private Producto buscarProducto(Long productoId) {

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

    private ImagenProducto buscarImagen(
            Long imagenId,
            Long productoId
    ) {

        return imagenRepository
                .findByIdAndProductoId(
                        imagenId,
                        productoId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Imagen no encontrada"
                        )
                );
    }

    private void quitarImagenPrincipal(
            Long productoId
    ) {

        imagenRepository
                .findByProductoIdAndEsPrincipalTrue(productoId)
                .ifPresent(imagen -> {
                    imagen.setEsPrincipal(false);
                    // Debe llegar a la base antes de marcar la nueva imagen principal.
                    imagenRepository.saveAndFlush(imagen);
                });
    }

    private ImagenProductoRespuestaDTO convertirDTO(
            ImagenProducto imagen
    ) {

        return ImagenProductoRespuestaDTO.builder()
                .id(imagen.getId())
                .productoId(
                        imagen.getProducto().getId()
                )
                .urlImagen(imagen.getUrlImagen())
                .esPrincipal(imagen.getEsPrincipal())
                .build();
    }
}