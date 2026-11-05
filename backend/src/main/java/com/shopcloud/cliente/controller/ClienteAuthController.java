package com.shopcloud.cliente.controller;

import com.shopcloud.auth.dto.LoginDTO;
import com.shopcloud.cliente.dto.ClienteAuthRespuestaDTO;
import com.shopcloud.cliente.dto.RegistroClienteDTO;
import com.shopcloud.cliente.service.ClienteAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publico/tiendas/{slug}/clientes")
@RequiredArgsConstructor
public class ClienteAuthController {

    private final ClienteAuthService clienteAuthService;

    @PostMapping("/registro")
    public ResponseEntity<ClienteAuthRespuestaDTO> registrar(
            @PathVariable String slug,
            @Valid @RequestBody RegistroClienteDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(clienteAuthService.registrar(slug, dto));
    }

    @PostMapping("/login")
    public ClienteAuthRespuestaDTO login(
            @PathVariable String slug,
            @Valid @RequestBody LoginDTO dto
    ) {
        return clienteAuthService.login(slug, dto);
    }
}
