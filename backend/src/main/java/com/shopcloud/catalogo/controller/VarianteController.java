package com.shopcloud.catalogo.controller;

import com.shopcloud.catalogo.dto.VarianteDTO;
import com.shopcloud.catalogo.dto.VarianteRespuestaDTO;
import com.shopcloud.catalogo.service.VarianteService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos/{productoId}/variantes")
@RequiredArgsConstructor
@PreAuthorize(
    "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class VarianteController {

    private final VarianteService varianteService;

    @PostMapping
    public ResponseEntity<VarianteRespuestaDTO> crear(
            @PathVariable Long productoId,
            @Valid @RequestBody VarianteDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        varianteService.crear(
                                productoId,
                                dto
                        )
                );
    }

    @GetMapping
    public ResponseEntity<List<VarianteRespuestaDTO>>
    listar(
            @PathVariable Long productoId
    ) {

        return ResponseEntity.ok(
                varianteService.listar(productoId)
        );
    }

    @GetMapping("/{varianteId}")
    public ResponseEntity<VarianteRespuestaDTO> obtener(
            @PathVariable Long productoId,
            @PathVariable Long varianteId
    ) {

        return ResponseEntity.ok(
                varianteService.obtener(
                        productoId,
                        varianteId
                )
        );
    }

    @PutMapping("/{varianteId}")
    public ResponseEntity<VarianteRespuestaDTO> actualizar(
            @PathVariable Long productoId,
            @PathVariable Long varianteId,
            @Valid @RequestBody VarianteDTO dto
    ) {

        return ResponseEntity.ok(
                varianteService.actualizar(
                        productoId,
                        varianteId,
                        dto
                )
        );
    }

    @DeleteMapping("/{varianteId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long productoId,
            @PathVariable Long varianteId
    ) {

        varianteService.eliminar(
                productoId,
                varianteId
        );

        return ResponseEntity.noContent().build();
    }
}