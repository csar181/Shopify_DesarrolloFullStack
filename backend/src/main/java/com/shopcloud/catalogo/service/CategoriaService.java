package com.shopcloud.catalogo.service;

import com.shopcloud.catalogo.dto.CategoriaDTO;
import com.shopcloud.catalogo.dto.CategoriaRespuestaDTO;
import com.shopcloud.catalogo.entity.Categoria;
import com.shopcloud.catalogo.repository.CategoriaRepository;

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
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final TenantService tenantService;
    private final LimitesPlanService limitesPlanService;
    @Transactional
    public CategoriaRespuestaDTO crear(CategoriaDTO dto) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        limitesPlanService.verificarCupoCategorias(tiendaId);

        if (categoriaRepository
                .existsByNombreIgnoreCaseAndTiendaId(
                        dto.getNombre().trim(),
                        tiendaId
                )) {

            throw new ReglaNegocioException(
                    "Ya existe una categoría con ese nombre"
            );
        }

        Tienda tienda =
                tenantService.obtenerTiendaActual();

        Categoria categoria =
                Categoria.builder()
                        .tienda(tienda)
                        .nombre(dto.getNombre().trim())
                        .descripcion(dto.getDescripcion())
                        .activo(true)
                        .build();

        return convertirDTO(
                categoriaRepository.save(categoria)
        );
    }

    @Transactional(readOnly = true)
    public List<CategoriaRespuestaDTO> listar() {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return categoriaRepository
                .findByTiendaIdAndActivoTrue(tiendaId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoriaRespuestaDTO obtener(Long id) {

        return convertirDTO(
                buscarCategoria(id)
        );
    }

    @Transactional
    public CategoriaRespuestaDTO actualizar(
            Long id,
            CategoriaDTO dto
    ) {

        Categoria categoria =
                buscarCategoria(id);

        if (categoriaRepository.existsByNombreIgnoreCaseAndTiendaIdAndIdNot(
                dto.getNombre().trim(), tenantService.obtenerTenantId(), id)) {
            throw new ReglaNegocioException("Ya existe una categoría con ese nombre");
        }

        categoria.setNombre(
                dto.getNombre().trim()
        );

        categoria.setDescripcion(
                dto.getDescripcion()
        );

        return convertirDTO(
                categoriaRepository.save(categoria)
        );
    }

    @Transactional
    public void eliminar(Long id) {

        Categoria categoria =
                buscarCategoria(id);

        categoria.setActivo(false);

        categoriaRepository.save(categoria);
    }

    @Transactional
    public CategoriaRespuestaDTO activar(Long id) {
        Categoria categoria = buscarCategoria(id);

        if (!Boolean.TRUE.equals(categoria.getActivo())) {
            limitesPlanService.verificarCupoCategorias(tenantService.obtenerTenantId());
            categoria.setActivo(true);
        }

        return convertirDTO(categoriaRepository.save(categoria));
    }

    private Categoria buscarCategoria(Long id) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return categoriaRepository
                .findByIdAndTiendaId(
                        id,
                        tiendaId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Categoría no encontrada"
                        )
                );
    }

    private CategoriaRespuestaDTO convertirDTO(
            Categoria categoria
    ) {

        return CategoriaRespuestaDTO.builder()
                .id(categoria.getId())
                .nombre(categoria.getNombre())
                .descripcion(categoria.getDescripcion())
                .activo(categoria.getActivo())
                .creadoEn(categoria.getCreadoEn())
                .build();
    }
}