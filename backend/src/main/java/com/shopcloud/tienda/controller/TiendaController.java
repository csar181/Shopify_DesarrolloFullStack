package com.shopcloud.tienda.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.shopcloud.security.UsuarioPrincipal;

import com.shopcloud.tienda.dto.ActualizarTiendaDTO;
import com.shopcloud.tienda.dto.CrearTiendaDTO;
import com.shopcloud.tienda.dto.TiendaRespuestaDTO;

import com.shopcloud.tienda.service.TiendaService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@PreAuthorize("hasRole('PROPIETARIO_TIENDA')")
@RequestMapping("/api/tiendas")
@RequiredArgsConstructor
public class TiendaController {

    private final TiendaService tiendaService;

    @PostMapping
    public ResponseEntity<TiendaRespuestaDTO> crear(
            @Valid @RequestBody CrearTiendaDTO dto,
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        TiendaRespuestaDTO respuesta =
                tiendaService.crear(
                        dto,
                        principal.getId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }

    @GetMapping("/mis-tiendas")
    public ResponseEntity<List<TiendaRespuestaDTO>>
    listarMisTiendas(
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        return ResponseEntity.ok(
                tiendaService.listarMisTiendas(
                        principal.getId()
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TiendaRespuestaDTO>
    obtener(
            @PathVariable Long id,
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        return ResponseEntity.ok(
                tiendaService.obtenerMiTienda(
                        id,
                        principal.getId()
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<TiendaRespuestaDTO>
    actualizar(
            @PathVariable Long id,
            @Valid @RequestBody
            ActualizarTiendaDTO dto,
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        return ResponseEntity.ok(
                tiendaService.actualizar(
                        id,
                        dto,
                        principal.getId()
                )
        );
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<TiendaRespuestaDTO> activar(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(tiendaService.activar(id, principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    desactivar(
            @PathVariable Long id,
            @AuthenticationPrincipal
            UsuarioPrincipal principal
    ) {

        tiendaService.desactivar(
                id,
                principal.getId()
        );

        return ResponseEntity.noContent()
                .build();
    }
}