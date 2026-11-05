package com.shopcloud.cliente.controller;

import com.shopcloud.cliente.dto.ActualizarPerfilClienteDTO;
import com.shopcloud.cliente.dto.ClienteDTO;
import com.shopcloud.cliente.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mi-cuenta/perfil")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class PerfilClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public ClienteDTO obtener() {
        return clienteService.obtenerPerfil();
    }

    @PutMapping
    public ClienteDTO actualizar(@Valid @RequestBody ActualizarPerfilClienteDTO dto) {
        return clienteService.actualizarPerfil(dto);
    }
}
