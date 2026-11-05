package com.shopcloud.cliente.controller;

import com.shopcloud.cliente.dto.ClienteDTO;
import com.shopcloud.cliente.dto.DireccionDTO;

import com.shopcloud.cliente.service.ClienteService;
import com.shopcloud.cliente.service.DireccionService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@PreAuthorize(
        "hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')"
)
public class ClienteController {

    private final ClienteService clienteService;
    private final DireccionService direccionService;

    @GetMapping
    public ResponseEntity<List<ClienteDTO>> listar() {

        return ResponseEntity.ok(
                clienteService.listar()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> obtener(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                clienteService.obtener(id)
        );
    }

    @GetMapping("/{clienteId}/direcciones")
    public ResponseEntity<List<DireccionDTO>>
    listarDirecciones(
            @PathVariable Long clienteId
    ) {

        return ResponseEntity.ok(
                direccionService.listar(
                        clienteId
                )
        );
    }

}
