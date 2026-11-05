package com.shopcloud.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private JwtService servicioCon(String secreto) {
        JwtService servicio = new JwtService();
        ReflectionTestUtils.setField(servicio, "jwtSecret", secreto);
        ReflectionTestUtils.setField(servicio, "jwtExpiration", 60000L);
        return servicio;
    }

    @Test
    void unaClaveConCaracteresNoBase64ImpideArrancarSinMostrarla() {
        String secreto = "mi_clave-secreta_con-guiones_y-subrayados_123456";

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> servicioCon(secreto).inicializarClave());

        assertFalse(error.getMessage().contains(secreto));
    }

    @Test
    void unaClaveDemasiadoCortaImpideArrancar() {
        String corta = Base64.getEncoder().encodeToString(new byte[16]);

        assertThrows(IllegalStateException.class, () -> servicioCon(corta).inicializarClave());
    }

    @Test
    void unaClaveValidaGeneraTokensVerificables() {
        JwtService servicio = servicioCon(Base64.getEncoder().encodeToString(new byte[48]));
        servicio.inicializarClave();

        assertEquals("7", servicio.validar(servicio.generarTokenUsuario(7L)).getSubject());
    }
}
