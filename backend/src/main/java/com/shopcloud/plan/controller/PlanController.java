package com.shopcloud.plan.controller;

import com.shopcloud.plan.dto.PlanRespuestaDTO;
import com.shopcloud.plan.service.PlanService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planes")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<List<PlanRespuestaDTO>>
    listar() {

        return ResponseEntity.ok(
                planService.listarActivos()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanRespuestaDTO> obtener(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                planService.obtener(id)
        );
    }
}