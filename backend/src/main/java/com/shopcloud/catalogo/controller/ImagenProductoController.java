package com.shopcloud.catalogo.controller;

import com.shopcloud.catalogo.dto.ImagenProductoDTO;
import com.shopcloud.catalogo.dto.ImagenProductoRespuestaDTO;
import com.shopcloud.catalogo.service.ImagenProductoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos/{productoId}/imagenes")
@RequiredArgsConstructor
@PreAuthorize(
    "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class ImagenProductoController {

    private final ImagenProductoService imagenService;

    @PostMapping
    public ResponseEntity<ImagenProductoRespuestaDTO> agregar(
            @PathVariable Long productoId,
            @Valid @RequestBody ImagenProductoDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                    imagenService.agregar(
                        productoId,
                        dto
                    )
                );
    }

    @GetMapping
    public ResponseEntity<List<ImagenProductoRespuestaDTO>>
    listar(
            @PathVariable Long productoId
    ) {

        return ResponseEntity.ok(
                imagenService.listar(productoId)
        );
    }

    @PutMapping("/{imagenId}")
    public ResponseEntity<ImagenProductoRespuestaDTO>
    actualizar(
            @PathVariable Long productoId,
            @PathVariable Long imagenId,
            @Valid @RequestBody ImagenProductoDTO dto
    ) {

        return ResponseEntity.ok(
                imagenService.actualizar(
                        productoId,
                        imagenId,
                        dto
                )
        );
    }

    @DeleteMapping("/{imagenId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long productoId,
            @PathVariable Long imagenId
    ) {

        imagenService.eliminar(
                productoId,
                imagenId
        );

        return ResponseEntity.noContent().build();
    }
}