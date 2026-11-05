package com.shopcloud.tienda.service;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.plan.entity.Suscripcion;
import com.shopcloud.plan.service.AccesoTiendaService;
import com.shopcloud.plan.service.SuscripcionService;
import com.shopcloud.tienda.dto.ActualizarTiendaDTO;
import com.shopcloud.tienda.dto.CrearTiendaDTO;
import com.shopcloud.tienda.dto.TiendaRespuestaDTO;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;
import com.shopcloud.usuario.entity.Usuario;
import com.shopcloud.usuario.repository.UsuarioRepository;
import com.shopcloud.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TiendaService {

    private final TiendaRepository tiendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SuscripcionService suscripcionService;
    private final AccesoTiendaService accesoTiendaService;

    /** La tienda y su prueba de 7 días se crean en la misma transacción. */
    @Transactional
    public TiendaRespuestaDTO crear(CrearTiendaDTO dto, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        String slugBase = SlugUtil.generar(
                dto.getSlug() != null && !dto.getSlug().isBlank()
                        ? dto.getSlug()
                        : dto.getNombre()
        );

        if (slugBase.isBlank()) {
            throw new ReglaNegocioException("No se pudo generar un slug válido");
        }

        Tienda tienda = tiendaRepository.save(
                Tienda.builder()
                        .propietario(usuario)
                        .nombre(dto.getNombre().trim())
                        .slug(generarSlugUnico(slugBase))
                        .descripcion(dto.getDescripcion())
                        .urlLogo(dto.getUrlLogo())
                        .urlBanner(dto.getUrlBanner())
                        .colorPrimario(dto.getColorPrimario())
                        .correoContacto(dto.getCorreoContacto())
                        .telefonoContacto(dto.getTelefonoContacto())
                        .activo(true)
                        .build()
        );

        suscripcionService.crearPrueba(tienda, dto.getPlanId());
        return convertirDTO(tienda);
    }

    @Transactional(readOnly = true)
    public List<TiendaRespuestaDTO> listarMisTiendas(Long usuarioId) {
        return tiendaRepository.findByPropietarioId(usuarioId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TiendaRespuestaDTO obtenerMiTienda(Long tiendaId, Long usuarioId) {
        return convertirDTO(buscarTiendaDelPropietario(tiendaId, usuarioId));
    }

    @Transactional
    public TiendaRespuestaDTO actualizar(Long tiendaId, ActualizarTiendaDTO dto, Long usuarioId) {
        Tienda tienda = buscarTiendaDelPropietario(tiendaId, usuarioId);
        accesoTiendaService.exigirAdministrable(tienda);

        tienda.setNombre(dto.getNombre().trim());
        tienda.setDescripcion(dto.getDescripcion());
        tienda.setUrlLogo(dto.getUrlLogo());
        tienda.setUrlBanner(dto.getUrlBanner());
        tienda.setColorPrimario(dto.getColorPrimario());
        tienda.setCorreoContacto(dto.getCorreoContacto());
        tienda.setTelefonoContacto(dto.getTelefonoContacto());

        return convertirDTO(tiendaRepository.save(tienda));
    }

    @Transactional
    public void desactivar(Long tiendaId, Long usuarioId) {
        Tienda tienda = buscarTiendaDelPropietario(tiendaId, usuarioId);
        tienda.setActivo(false);
        tiendaRepository.save(tienda);
    }

    @Transactional
    public TiendaRespuestaDTO activar(Long tiendaId, Long usuarioId) {
        Tienda tienda = buscarTiendaDelPropietario(tiendaId, usuarioId);
        tienda.setActivo(true);
        return convertirDTO(tiendaRepository.save(tienda));
    }

    private Tienda buscarTiendaDelPropietario(Long tiendaId, Long usuarioId) {
        return tiendaRepository.findByIdAndPropietarioId(tiendaId, usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Tienda no encontrada o no pertenece al usuario"));
    }

    private String generarSlugUnico(String slugBase) {
        String slug = slugBase;
        int contador = 2;
        while (tiendaRepository.existsBySlug(slug)) {
            slug = slugBase + "-" + contador;
            contador++;
        }
        return slug;
    }

    private TiendaRespuestaDTO convertirDTO(Tienda tienda) {
        Optional<Suscripcion> vigente = accesoTiendaService.obtenerVigente(tienda.getId());

        return TiendaRespuestaDTO.builder()
                .id(tienda.getId())
                .nombre(tienda.getNombre())
                .slug(tienda.getSlug())
                .descripcion(tienda.getDescripcion())
                .urlLogo(tienda.getUrlLogo())
                .urlBanner(tienda.getUrlBanner())
                .colorPrimario(tienda.getColorPrimario())
                .correoContacto(tienda.getCorreoContacto())
                .telefonoContacto(tienda.getTelefonoContacto())
                .activo(tienda.getActivo())
                .creadoEn(tienda.getCreadoEn())
                .publicada(accesoTiendaService.estaPublicada(tienda))
                .administrable(accesoTiendaService.esAdministrable(tienda))
                .suscripcionTipo(vigente.map(Suscripcion::getTipo).orElse(null))
                .planNombre(vigente.map(s -> s.getPlan().getNombre()).orElse(null))
                .suscripcionFin(vigente.map(Suscripcion::getFechaFin).orElse(null))
                .build();
    }
}
