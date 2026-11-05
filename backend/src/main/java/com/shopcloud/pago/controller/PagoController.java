package com.shopcloud.pago.controller;

import com.shopcloud.pago.dto.MetodoPagoDTO;
import com.shopcloud.pago.dto.TransaccionDTO;
import com.shopcloud.pago.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class PagoController {

    private final PagoService pagoService;

    @GetMapping("/metodos")
    public List<MetodoPagoDTO> listarMetodos() {
        return pagoService.listarMetodosActivos();
    }

    @GetMapping("/transacciones")
    public List<TransaccionDTO> listarTransacciones() {
        return pagoService.listarTransaccionesPropias();
    }

    @GetMapping("/transacciones/{id}")
    public TransaccionDTO obtenerTransaccion(@PathVariable Long id) {
        return pagoService.obtenerTransaccionPropia(id);
    }
}
