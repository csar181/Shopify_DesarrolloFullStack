package com.shopcloud.plan.controller;

import com.shopcloud.plan.dto.SeleccionPlanDTO;
import com.shopcloud.plan.dto.SuscripcionRespuestaDTO;
import com.shopcloud.plan.service.SuscripcionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suscripciones")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPIETARIO_TIENDA')")
public class SuscripcionController {

    private final SuscripcionService suscripcionService;

    /** Pago simulado: contrata un plan o renueva el vigente. */
    @PostMapping("/contratar")
    public ResponseEntity<SuscripcionRespuestaDTO> contratar(
            @Valid @RequestBody SeleccionPlanDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(suscripcionService.contratar(dto));
    }

    /** Historial de la tienda, incluidos los pagos. */
    @GetMapping
    public ResponseEntity<List<SuscripcionRespuestaDTO>> listar() {
        return ResponseEntity.ok(suscripcionService.listar());
    }

    @GetMapping("/activa")
    public ResponseEntity<SuscripcionRespuestaDTO> obtenerActiva() {
        return ResponseEntity.ok(suscripcionService.obtenerActiva());
    }

    /** Cambia el plan durante la prueba, sin reiniciar los días. */
    @PutMapping("/cambiar-plan")
    public ResponseEntity<SuscripcionRespuestaDTO> cambiarPlan(
            @Valid @RequestBody SeleccionPlanDTO dto
    ) {
        return ResponseEntity.ok(suscripcionService.cambiarPlanEnPrueba(dto));
    }

    @DeleteMapping("/activa")
    public ResponseEntity<Void> cancelar() {
        suscripcionService.cancelar();
        return ResponseEntity.noContent().build();
    }
}
