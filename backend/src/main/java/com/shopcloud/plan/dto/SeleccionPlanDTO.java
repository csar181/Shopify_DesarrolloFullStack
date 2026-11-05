package com.shopcloud.plan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/** Solo se elige el plan: precio y fechas los calcula el backend. */
@Getter
@Setter
public class SeleccionPlanDTO {

    @NotNull(message = "El plan es obligatorio")
    private Long planId;
}
