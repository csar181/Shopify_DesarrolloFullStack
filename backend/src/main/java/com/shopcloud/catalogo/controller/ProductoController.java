package com.shopcloud.catalogo.controller;

import com.shopcloud.catalogo.dto.ActualizarProductoDTO;
import com.shopcloud.catalogo.dto.CrearProductoDTO;
import com.shopcloud.catalogo.dto.ProductoRespuestaDTO;
import com.shopcloud.catalogo.service.ProductoService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@PreAuthorize(
        "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class ProductoController {

    private final ProductoService productoService;

    @PostMapping
    public ResponseEntity<ProductoRespuestaDTO> crear(
            @Valid @RequestBody CrearProductoDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productoService.crear(dto));
    }

    @GetMapping
    public ResponseEntity<List<ProductoRespuestaDTO>>
    listar() {

        return ResponseEntity.ok(
                productoService.listar()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoRespuestaDTO> obtener(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productoService.obtener(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoRespuestaDTO> actualizar(
            @PathVariable Long id,
            @Valid
            @RequestBody ActualizarProductoDTO dto
    ) {

        return ResponseEntity.ok(
                productoService.actualizar(id, dto)
        );
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<ProductoRespuestaDTO> activar(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.activar(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id
    ) {

        productoService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}