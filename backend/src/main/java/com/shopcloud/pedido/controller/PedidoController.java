package com.shopcloud.pedido.controller;

import com.shopcloud.pedido.dto.PedidoDTO;
import com.shopcloud.pedido.dto.PedidoRespuestaDTO;
import com.shopcloud.pedido.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public ResponseEntity<List<PedidoDTO>> listar() {
        return ResponseEntity.ok(pedidoService.listarDelClienteActual());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoRespuestaDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.obtenerDelClienteActual(id));
    }
}
