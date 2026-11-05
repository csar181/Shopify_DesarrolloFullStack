package com.shopcloud.pedido.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DesgloseImportesTest {

    @Test
    void separaElIgvIncluidoEnElPrecio() {
        DesgloseImportes desglose = DesgloseImportes.calcular(new BigDecimal("118.00"), BigDecimal.ZERO);

        assertEquals(new BigDecimal("100.00"), desglose.baseImponible());
        assertEquals(new BigDecimal("18.00"), desglose.montoIgv());
        assertEquals(new BigDecimal("118.00"), desglose.total());
    }

    @Test
    void calculaElIgvSobreElImporteConDescuento() {
        DesgloseImportes desglose =
                DesgloseImportes.calcular(new BigDecimal("100.00"), new BigDecimal("10.00"));

        assertEquals(new BigDecimal("90.00"), desglose.total());
        assertEquals(new BigDecimal("76.27"), desglose.baseImponible());
        assertEquals(new BigDecimal("13.73"), desglose.montoIgv());
    }

    @Test
    void baseEIgvSiempreSumanElTotal() {
        for (int centimos = 1; centimos <= 20000; centimos += 7) {
            BigDecimal total = BigDecimal.valueOf(centimos, 2);
            DesgloseImportes desglose = DesgloseImportes.calcular(total, BigDecimal.ZERO);

            assertEquals(total, desglose.baseImponible().add(desglose.montoIgv()));
        }
    }
}
