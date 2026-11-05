package com.shopcloud.inventario.controller;

import com.shopcloud.inventario.dto.ActualizarInventarioDTO;
import com.shopcloud.inventario.dto.CrearInventarioDTO;
import com.shopcloud.inventario.dto.InventarioRespuestaDTO;
import com.shopcloud.inventario.service.InventarioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
@PreAuthorize(
    "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class InventarioController {

    private final InventarioService inventarioService;

    @PostMapping
    public ResponseEntity<InventarioRespuestaDTO> crear(
            @Valid @RequestBody CrearInventarioDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        inventarioService.crear(dto)
                );
    }

    @GetMapping
    public ResponseEntity<List<InventarioRespuestaDTO>>
    listar() {

        return ResponseEntity.ok(
                inventarioService.listar()
        );
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<List<InventarioRespuestaDTO>>
    listarStockBajo() {

        return ResponseEntity.ok(
                inventarioService.listarStockBajo()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventarioRespuestaDTO> obtener(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                inventarioService.obtener(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        inventarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventarioRespuestaDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarInventarioDTO dto
    ) {

        return ResponseEntity.ok(
                inventarioService.actualizar(
                        id,
                        dto
                )
        );
    }
}