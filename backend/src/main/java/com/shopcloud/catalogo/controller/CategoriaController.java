package com.shopcloud.catalogo.controller;

import com.shopcloud.catalogo.dto.CategoriaDTO;
import com.shopcloud.catalogo.dto.CategoriaRespuestaDTO;
import com.shopcloud.catalogo.service.CategoriaService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@PreAuthorize(
        "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class CategoriaController {

    private final CategoriaService categoriaService;

    @PostMapping
    public ResponseEntity<CategoriaRespuestaDTO> crear(
            @Valid @RequestBody CategoriaDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        categoriaService.crear(dto)
                );
    }

    @GetMapping
    public ResponseEntity<List<CategoriaRespuestaDTO>>
    listar(@RequestParam(defaultValue = "false") boolean incluirInactivos) {

        return ResponseEntity.ok(
                categoriaService.listar(incluirInactivos)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaRespuestaDTO> obtener(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                categoriaService.obtener(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaRespuestaDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaDTO dto
    ) {

        return ResponseEntity.ok(
                categoriaService.actualizar(
                        id,
                        dto
                )
        );
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<CategoriaRespuestaDTO> activar(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.activar(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id
    ) {

        categoriaService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}