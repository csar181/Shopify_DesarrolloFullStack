package com.shopcloud.cliente.controller;

import com.shopcloud.cliente.dto.DatosFacturacionDTO;
import com.shopcloud.cliente.service.DatosFacturacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mi-cuenta/datos-facturacion")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class DatosFacturacionController {

    private final DatosFacturacionService datosFacturacionService;

    @GetMapping
    public List<DatosFacturacionDTO> listar() {
        return datosFacturacionService.listar();
    }

    @PostMapping
    public ResponseEntity<DatosFacturacionDTO> crear(@Valid @RequestBody DatosFacturacionDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(datosFacturacionService.crear(dto));
    }

    @PutMapping("/{id}")
    public DatosFacturacionDTO actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DatosFacturacionDTO dto
    ) {
        return datosFacturacionService.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        datosFacturacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
