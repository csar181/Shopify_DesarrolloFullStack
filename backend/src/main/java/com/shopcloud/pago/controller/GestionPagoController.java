package com.shopcloud.pago.controller;

import com.shopcloud.pago.dto.GuardarMetodoPagoDTO;
import com.shopcloud.pago.dto.MetodoPagoDTO;
import com.shopcloud.pago.dto.TransaccionDTO;
import com.shopcloud.pago.service.MetodoPagoService;
import com.shopcloud.pago.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gestion")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPIETARIO_TIENDA')")
public class GestionPagoController {

    private final MetodoPagoService metodoPagoService;
    private final PagoService pagoService;

    @PostMapping("/metodos-pago")
    public ResponseEntity<MetodoPagoDTO> crearMetodo(@Valid @RequestBody GuardarMetodoPagoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(metodoPagoService.crear(dto));
    }

    @GetMapping("/metodos-pago")
    public List<MetodoPagoDTO> listarMetodos() {
        return metodoPagoService.listar();
    }

    @GetMapping("/metodos-pago/{id}")
    public MetodoPagoDTO obtenerMetodo(@PathVariable Long id) {
        return metodoPagoService.obtener(id);
    }

    @PutMapping("/metodos-pago/{id}")
    public MetodoPagoDTO actualizarMetodo(
            @PathVariable Long id,
            @Valid @RequestBody GuardarMetodoPagoDTO dto
    ) {
        return metodoPagoService.actualizar(id, dto);
    }

    @PatchMapping("/metodos-pago/{id}/activar")
    public MetodoPagoDTO activarMetodo(@PathVariable Long id) {
        return metodoPagoService.activar(id);
    }

    @DeleteMapping("/metodos-pago/{id}")
    public ResponseEntity<Void> desactivarMetodo(@PathVariable Long id) {
        metodoPagoService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/transacciones")
    public List<TransaccionDTO> listarTransacciones() {
        return pagoService.listarTransaccionesDeLaTienda();
    }

    @GetMapping("/transacciones/{id}")
    public TransaccionDTO obtenerTransaccion(@PathVariable Long id) {
        return pagoService.obtenerTransaccionDeLaTienda(id);
    }
}
