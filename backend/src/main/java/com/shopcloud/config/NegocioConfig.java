package com.shopcloud.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@Configuration
@EnableScheduling
public class NegocioConfig {

    @Value("${app.zona-horaria}")
    private String zonaHoraria;

    /** Las columnas TIMESTAMP no guardan zona: todo se interpreta en la de negocio. */
    @PostConstruct
    public void configurarZonaHoraria() {
        TimeZone.setDefault(TimeZone.getTimeZone(zonaHoraria));
    }
}
