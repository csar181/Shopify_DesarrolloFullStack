package com.shopcloud.descuento.controller;

import com.shopcloud.descuento.dto.ActualizarDescuentoDTO;
import com.shopcloud.descuento.dto.CrearDescuentoDTO;
import com.shopcloud.descuento.dto.DescuentoRespuestaDTO;
import com.shopcloud.descuento.service.DescuentoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/descuentos")
@RequiredArgsConstructor
@PreAuthorize(
    "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class DescuentoController {

    private final DescuentoService descuentoService;

    @PostMapping
    public ResponseEntity<DescuentoRespuestaDTO> crear(
            @Valid @RequestBody CrearDescuentoDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        descuentoService.crear(dto)
                );
    }

    @GetMapping
    public ResponseEntity<List<DescuentoRespuestaDTO>>
    listar() {

        return ResponseEntity.ok(
                descuentoService.listar()
        );
    }

    @GetMapping("/vigentes")
    public ResponseEntity<List<DescuentoRespuestaDTO>>
    listarVigentes() {

        return ResponseEntity.ok(
                descuentoService.listarVigentes()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<DescuentoRespuestaDTO> obtener(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                descuentoService.obtener(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<DescuentoRespuestaDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarDescuentoDTO dto
    ) {

        return ResponseEntity.ok(
                descuentoService.actualizar(
                        id,
                        dto
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(
            @PathVariable Long id
    ) {

        descuentoService.desactivar(id);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<DescuentoRespuestaDTO> activar(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                descuentoService.activar(id)
        );
    }
}