package com.shopcloud.pedido.controller;

import com.shopcloud.pedido.dto.CheckoutDTO;
import com.shopcloud.pedido.dto.PedidoRespuestaDTO;
import com.shopcloud.pedido.dto.ResumenCheckoutDTO;
import com.shopcloud.pedido.service.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class CheckoutController {

    private final CheckoutService checkoutService;

    @GetMapping("/resumen")
    public ResumenCheckoutDTO resumen(@RequestParam(required = false) String codigoDescuento) {
        return checkoutService.obtenerResumen(codigoDescuento);
    }

    @PostMapping
    public ResponseEntity<PedidoRespuestaDTO> realizarCheckout(@Valid @RequestBody CheckoutDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(checkoutService.realizarCheckout(dto));
    }
}
