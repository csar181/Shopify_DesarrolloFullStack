package com.shopcloud.usuario.service;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.usuario.dto.ActualizarUsuarioDTO;
import com.shopcloud.usuario.dto.UsuarioDTO;
import com.shopcloud.security.UsuarioPrincipal;
import java.util.List;
import com.shopcloud.usuario.entity.Usuario;
import com.shopcloud.usuario.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public UsuarioDTO obtenerPorId(Long usuarioId) {

        Usuario usuario = buscarUsuario(usuarioId);

        return convertirDTO(usuario);
    }

    @Transactional
    public UsuarioDTO actualizar(
            Long usuarioId,
            ActualizarUsuarioDTO dto
    ) {

        Usuario usuario = buscarUsuario(usuarioId);

        String nuevoCorreo = dto.getCorreoElectronico()
                .trim()
                .toLowerCase();

        if (!usuario.getCorreoElectronico()
                .equalsIgnoreCase(nuevoCorreo)
                && usuarioRepository
                    .existsByCorreoElectronico(nuevoCorreo)) {

            throw new ReglaNegocioException(
        "El correo electrónico ya está registrado"
            );
        }

        usuario.setNombre(
                dto.getNombre().trim()
        );

        usuario.setCorreoElectronico(
                nuevoCorreo
        );

        Usuario actualizado =
                usuarioRepository.save(usuario);

        return convertirDTO(actualizado);
    }

    private Usuario buscarUsuario(Long usuarioId) {

        return usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                          "Usuario no encontrado")
                );
    }

    private UsuarioDTO convertirDTO(Usuario usuario) {

        return UsuarioDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .correoElectronico(
                        usuario.getCorreoElectronico()
                )
                .activo(usuario.getActivo())
                .roles(List.of(UsuarioPrincipal.ROL_PROPIETARIO))
                .creadoEn(usuario.getCreadoEn())
                .actualizadoEn(
                        usuario.getActualizadoEn()
                )
                .build();
    }
}