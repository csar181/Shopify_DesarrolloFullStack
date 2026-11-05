package com.shopcloud.carrito.controller;

import com.shopcloud.carrito.dto.ActualizarCantidadDTO;
import com.shopcloud.carrito.dto.AgregarProductoDTO;
import com.shopcloud.carrito.dto.CarritoDTO;
import com.shopcloud.carrito.dto.SincronizarCarritoDTO;
import com.shopcloud.carrito.service.CarritoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carrito")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class CarritoController {

    private final CarritoService carritoService;

    @GetMapping
    public CarritoDTO obtener() {
        return carritoService.obtenerActual();
    }

    @PostMapping("/productos")
    public CarritoDTO agregar(@Valid @RequestBody AgregarProductoDTO dto) {
        return carritoService.agregarProducto(dto);
    }

    @PostMapping("/sincronizar")
    public CarritoDTO sincronizar(@Valid @RequestBody SincronizarCarritoDTO dto) {
        return carritoService.sincronizar(dto);
    }

    @PutMapping("/productos/{elementoId}")
    public CarritoDTO actualizar(
            @PathVariable Long elementoId,
            @Valid @RequestBody ActualizarCantidadDTO dto
    ) {
        return carritoService.actualizarCantidad(elementoId, dto);
    }

    @DeleteMapping("/productos/{elementoId}")
    public ResponseEntity<Void> eliminar(@PathVariable Long elementoId) {
        carritoService.eliminarElemento(elementoId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> vaciar() {
        carritoService.vaciar();
        return ResponseEntity.noContent().build();
    }
}
