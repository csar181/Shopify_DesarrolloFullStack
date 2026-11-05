package com.shopcloud.plan.service;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.plan.dto.PlanRespuestaDTO;
import com.shopcloud.plan.entity.Plan;
import com.shopcloud.plan.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;

    @Transactional(readOnly = true)
    public List<PlanRespuestaDTO> listarActivos() {
        return planRepository.findByActivoTrue()
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanRespuestaDTO obtener(Long id) {
        return planRepository.findByIdAndActivoTrue(id)
                .map(this::convertirDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan no encontrado"));
    }

    private PlanRespuestaDTO convertirDTO(Plan plan) {
        return PlanRespuestaDTO.builder()
                .id(plan.getId())
                .nombre(plan.getNombre())
                .descripcion(plan.getDescripcion())
                .precio(plan.getPrecio())
                .periodicidad(plan.getPeriodicidad())
                .maxProductos(plan.getMaxProductos())
                .maxUsuarios(plan.getMaxUsuarios())
                .maxCategorias(plan.getMaxCategorias())
                .maxImagenesProducto(plan.getMaxImagenesProducto())
                .funcionalidades(plan.getFuncionalidades())
                .activo(plan.getActivo())
                .build();
    }
}
