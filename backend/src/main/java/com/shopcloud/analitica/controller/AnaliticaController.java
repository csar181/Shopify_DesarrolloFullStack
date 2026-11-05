package com.shopcloud.analitica.controller;

import com.shopcloud.analitica.dto.*;
import com.shopcloud.analitica.service.AnaliticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analitica")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')")
public class AnaliticaController {
    private final AnaliticaService analiticaService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(analiticaService.obtenerDashboard(desde, hasta));
    }

    @GetMapping("/ventas")
    public ResponseEntity<List<ResumenVentasDTO>> ventas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(analiticaService.obtenerVentasDiarias(desde, hasta));
    }

    @GetMapping("/productos-mas-vendidos")
    public ResponseEntity<List<ProductoVendidoDTO>> productosMasVendidos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(analiticaService.obtenerProductosMasVendidos(
                desde, hasta, limite));
    }
}
