package com.shopcloud.analitica.service;

import com.shopcloud.analitica.controller.AnaliticaController;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.*;

class AnaliticaControllerSecurityTest {
    @Test
    void clienteNoEstaIncluidoEntreLosRolesAutorizados() {
        PreAuthorize autorizacion = AnaliticaController.class
                .getAnnotation(PreAuthorize.class);

        assertNotNull(autorizacion);
        assertEquals("hasAnyRole('PROPIETARIO_TIENDA', 'SUPER_ADMINISTRADOR')",
                autorizacion.value());
        assertFalse(autorizacion.value().contains("CLIENTE"));
    }
}
