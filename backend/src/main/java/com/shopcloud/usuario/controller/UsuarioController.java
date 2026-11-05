package com.shopcloud.usuario.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.shopcloud.security.UsuarioPrincipal;

import com.shopcloud.usuario.dto.ActualizarUsuarioDTO;
import com.shopcloud.usuario.dto.UsuarioDTO;
import com.shopcloud.usuario.service.UsuarioService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

@RestController
@PreAuthorize("hasRole('PROPIETARIO_TIENDA')")
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/perfil")
    public ResponseEntity<UsuarioDTO> obtenerPerfil(
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        return ResponseEntity.ok(
                usuarioService.obtenerPorId(
                        principal.getId()
                )
        );
    }

    @PutMapping("/perfil")
    public ResponseEntity<UsuarioDTO> actualizarPerfil(
            @Valid @RequestBody
            ActualizarUsuarioDTO dto,

            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        return ResponseEntity.ok(
                usuarioService.actualizar(
                        principal.getId(),
                        dto
                )
        );
    }
}