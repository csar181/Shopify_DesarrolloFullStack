package com.shopcloud.descuento.service;

import com.shopcloud.descuento.dto.ActualizarDescuentoDTO;
import com.shopcloud.descuento.dto.CrearDescuentoDTO;
import com.shopcloud.descuento.dto.DescuentoRespuestaDTO;

import com.shopcloud.descuento.entity.Descuento;
import com.shopcloud.descuento.repository.DescuentoRepository;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;

import com.shopcloud.tenant.TenantService;
import com.shopcloud.tienda.entity.Tienda;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DescuentoService {

    private static final String TIPO_PORCENTAJE = "PORCENTAJE";
    private static final String TIPO_MONTO_FIJO = "MONTO_FIJO";
    private static final BigDecimal CIEN = new BigDecimal("100");

    private final DescuentoRepository descuentoRepository;
    private final TenantService tenantService;

    @Transactional
    public DescuentoRespuestaDTO crear(
            CrearDescuentoDTO dto
    ) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        String codigo =
                normalizarCodigo(dto.getCodigo());

        String tipo =
                normalizarTipo(dto.getTipo());

        validarCodigoCrear(
                codigo,
                tiendaId
        );

        validarDatos(
                tipo,
                dto.getValor(),
                dto.getFechaInicio(),
                dto.getFechaFin()
        );

        Tienda tienda =
                tenantService.obtenerTiendaActual();

        Descuento descuento =
                Descuento.builder()
                        .tienda(tienda)
                        .codigo(codigo)
                        .tipo(tipo)
                        .valor(dto.getValor())
                        .fechaInicio(dto.getFechaInicio())
                        .fechaFin(dto.getFechaFin())
                        .activo(true)
                        .build();

        return convertirDTO(
                descuentoRepository.save(descuento)
        );
    }

    @Transactional(readOnly = true)
    public List<DescuentoRespuestaDTO> listar() {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return descuentoRepository
                .findByTiendaId(tiendaId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DescuentoRespuestaDTO obtener(Long id) {

        return convertirDTO(
                buscarDescuento(id)
        );
    }

    @Transactional
    public DescuentoRespuestaDTO actualizar(
            Long id,
            ActualizarDescuentoDTO dto
    ) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        Descuento descuento =
                buscarDescuento(id);

        String codigo =
                normalizarCodigo(dto.getCodigo());

        String tipo =
                normalizarTipo(dto.getTipo());

        validarCodigoActualizar(
                codigo,
                tiendaId,
                id
        );

        validarDatos(
                tipo,
                dto.getValor(),
                dto.getFechaInicio(),
                dto.getFechaFin()
        );

        descuento.setCodigo(codigo);
        descuento.setTipo(tipo);
        descuento.setValor(dto.getValor());
        descuento.setFechaInicio(dto.getFechaInicio());
        descuento.setFechaFin(dto.getFechaFin());

        return convertirDTO(
                descuentoRepository.save(descuento)
        );
    }

    @Transactional
    public void desactivar(Long id) {

        Descuento descuento =
                buscarDescuento(id);

        descuento.setActivo(false);

        descuentoRepository.save(descuento);
    }

    @Transactional
    public DescuentoRespuestaDTO activar(Long id) {

        Descuento descuento =
                buscarDescuento(id);

        descuento.setActivo(true);

        return convertirDTO(
                descuentoRepository.save(descuento)
        );
    }

    @Transactional(readOnly = true)
    public List<DescuentoRespuestaDTO> listarVigentes() {

        Long tiendaId =
                tenantService.obtenerTenantId();

        LocalDateTime ahora =
                LocalDateTime.now();

        return descuentoRepository
                .findByTiendaIdAndActivoTrue(tiendaId)
                .stream()
                .filter(descuento ->
                        !ahora.isBefore(
                                descuento.getFechaInicio()
                        )
                        &&
                        !ahora.isAfter(
                                descuento.getFechaFin()
                        )
                )
                .map(this::convertirDTO)
                .toList();
    }

    /**
     * Valida el código en la tienda indicada y calcula el importe sobre el total de
     * los productos. Un monto fijo no puede superar ese total.
     */
    @Transactional(readOnly = true)
    public DescuentoAplicado aplicar(String codigo, Long tiendaId, BigDecimal subtotal) {
        Descuento descuento = descuentoRepository
                .findByCodigoIgnoreCaseAndTiendaId(normalizarCodigo(codigo), tiendaId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "El código de descuento no existe en esta tienda"));

        LocalDateTime ahora = LocalDateTime.now();
        boolean vigente = Boolean.TRUE.equals(descuento.getActivo())
                && !ahora.isBefore(descuento.getFechaInicio())
                && !ahora.isAfter(descuento.getFechaFin());

        if (!vigente) {
            throw new ReglaNegocioException("El código de descuento no está vigente");
        }

        BigDecimal monto = TIPO_PORCENTAJE.equals(descuento.getTipo())
                ? subtotal.multiply(descuento.getValor()).divide(CIEN, 2, RoundingMode.HALF_UP)
                : descuento.getValor();

        if (monto.compareTo(subtotal) > 0) {
            throw new ReglaNegocioException(
                    "El descuento no puede superar el total de los productos");
        }
        return new DescuentoAplicado(descuento, monto);
    }

    private Descuento buscarDescuento(Long id) {

        Long tiendaId =
                tenantService.obtenerTenantId();

        return descuentoRepository
                .findByIdAndTiendaId(
                        id,
                        tiendaId
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Descuento no encontrado"
                        )
                );
    }

    private void validarCodigoCrear(
            String codigo,
            Long tiendaId
    ) {

        if (descuentoRepository
                .existsByCodigoIgnoreCaseAndTiendaId(
                        codigo,
                        tiendaId
                )) {

            throw new ReglaNegocioException(
                    "Ya existe un descuento con ese código"
            );
        }
    }

    private void validarCodigoActualizar(
            String codigo,
            Long tiendaId,
            Long descuentoId
    ) {

        if (descuentoRepository
                .existsByCodigoIgnoreCaseAndTiendaIdAndIdNot(
                        codigo,
                        tiendaId,
                        descuentoId
                )) {

            throw new ReglaNegocioException(
                    "Ya existe otro descuento con ese código"
            );
        }
    }

    private void validarDatos(
            String tipo,
            BigDecimal valor,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin
    ) {

        if (!tipo.equals("PORCENTAJE")
                && !tipo.equals(TIPO_MONTO_FIJO)) {

            throw new ReglaNegocioException(
                    "El tipo debe ser PORCENTAJE o MONTO_FIJO"
            );
        }

        if (valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException(
                    "El valor debe ser mayor que cero"
            );
        }

        if (tipo.equals("PORCENTAJE")
                &&
                valor.compareTo(
                        new BigDecimal("100")
                ) > 0) {

            throw new ReglaNegocioException(
                    "El porcentaje no puede superar 100"
            );
        }

        if (fechaFin.isBefore(fechaInicio)) {

            throw new ReglaNegocioException(
                    "La fecha de fin no puede ser anterior " +
                    "a la fecha de inicio"
            );
        }
    }

    private String normalizarCodigo(String codigo) {

        return codigo
                .trim()
                .toUpperCase();
    }

    private String normalizarTipo(String tipo) {

        return tipo
                .trim()
                .toUpperCase();
    }

    private DescuentoRespuestaDTO convertirDTO(
            Descuento descuento
    ) {

        LocalDateTime ahora =
                LocalDateTime.now();

        boolean vigente =
                Boolean.TRUE.equals(
                        descuento.getActivo()
                )
                &&
                !ahora.isBefore(
                        descuento.getFechaInicio()
                )
                &&
                !ahora.isAfter(
                        descuento.getFechaFin()
                );

        return DescuentoRespuestaDTO.builder()
                .id(descuento.getId())
                .codigo(descuento.getCodigo())
                .tipo(descuento.getTipo())
                .valor(descuento.getValor())
                .fechaInicio(
                        descuento.getFechaInicio()
                )
                .fechaFin(
                        descuento.getFechaFin()
                )
                .activo(descuento.getActivo())
                .vigente(vigente)
                .build();
    }
}