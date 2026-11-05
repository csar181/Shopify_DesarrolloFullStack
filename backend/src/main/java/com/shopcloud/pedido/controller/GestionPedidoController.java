package com.shopcloud.pedido.controller;

import com.shopcloud.pedido.dto.ActualizarEstadoPedidoDTO;
import com.shopcloud.pedido.dto.PedidoDTO;
import com.shopcloud.pedido.dto.PedidoRespuestaDTO;
import com.shopcloud.pedido.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Disponible aunque venza la suscripción: las ventas realizadas se siguen gestionando. */
@RestController
@RequestMapping("/api/gestion/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPIETARIO_TIENDA')")
public class GestionPedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public List<PedidoDTO> listar(@RequestParam(required = false) String estado) {
        return pedidoService.listarDeLaTienda(estado);
    }

    @GetMapping("/{id}")
    public PedidoRespuestaDTO obtener(@PathVariable Long id) {
        return pedidoService.obtenerDeLaTienda(id);
    }

    @PatchMapping("/{id}/estado")
    public PedidoRespuestaDTO actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoPedidoDTO dto
    ) {
        return pedidoService.actualizarEstado(id, dto);
    }
}
