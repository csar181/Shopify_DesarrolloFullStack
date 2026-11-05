package com.shopcloud.plan.service;

import com.shopcloud.plan.repository.SuscripcionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Mantiene al día el estado guardado de las suscripciones. El acceso no depende de
 * este proceso: AccesoTiendaService compara las fechas en cada petición.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VencimientoSuscripcionesJob {

    private final SuscripcionRepository suscripcionRepository;

    @Scheduled(cron = "0 0 * * * *", zone = "${app.zona-horaria}")
    @Transactional
    public void marcarVencidas() {
        int vencidas = suscripcionRepository.marcarVencidas(LocalDateTime.now());
        if (vencidas > 0) {
            log.info("Suscripciones marcadas como vencidas: {}", vencidas);
        }
    }
}
