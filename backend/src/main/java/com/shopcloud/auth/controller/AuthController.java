package com.shopcloud.auth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.shopcloud.auth.dto.AuthRespuestaDTO;
import com.shopcloud.auth.dto.LoginDTO;
import com.shopcloud.auth.dto.RegistroDTO;
import com.shopcloud.auth.dto.UsuarioRespuestaDTO;

import com.shopcloud.auth.service.AuthService;
import com.shopcloud.security.UsuarioPrincipal;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registro")
    public ResponseEntity<AuthRespuestaDTO> registrar(
            @Valid @RequestBody RegistroDTO dto
    ) {

        AuthRespuestaDTO respuesta =
                authService.registrar(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthRespuestaDTO> login(
            @Valid @RequestBody LoginDTO dto
    ) {

        return ResponseEntity.ok(
                authService.login(dto)
        );
    }

    @PreAuthorize("hasRole('PROPIETARIO_TIENDA')")
    @GetMapping("/me")
    public ResponseEntity<UsuarioRespuestaDTO> me(
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        return ResponseEntity.ok(
                authService.obtenerUsuarioActual(principal)
        );
    }
}