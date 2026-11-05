package com.shopcloud.cliente.controller;

import com.shopcloud.cliente.dto.DireccionDTO;
import com.shopcloud.cliente.service.DireccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mi-cuenta/direcciones")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class MiCuentaController {

    private final DireccionService direccionService;

    @GetMapping
    public ResponseEntity<List<DireccionDTO>> listar() {
        return ResponseEntity.ok(
                direccionService.listarDelClienteActual()
        );
    }

    @PostMapping
    public ResponseEntity<DireccionDTO> crear(
            @Valid @RequestBody DireccionDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(direccionService.crearParaClienteActual(dto));
    }

    @PutMapping("/{direccionId}")
    public ResponseEntity<DireccionDTO> actualizar(
            @PathVariable Long direccionId,
            @Valid @RequestBody DireccionDTO dto
    ) {
        return ResponseEntity.ok(
                direccionService.actualizarDelClienteActual(direccionId, dto)
        );
    }

    @DeleteMapping("/{direccionId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long direccionId
    ) {
        direccionService.eliminarDelClienteActual(direccionId);
        return ResponseEntity.noContent().build();
    }
}
