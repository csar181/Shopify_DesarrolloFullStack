package com.shopcloud.tenant;

import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TiendaRepository tiendaRepository;

    public Long obtenerTenantId() {
        return TenantContext.getTenantId();
    }

    @Transactional(readOnly = true)
    public Tienda obtenerTiendaActual() {

        Long tiendaId =
                TenantContext.getTenantId();

        return tiendaRepository
                .findById(tiendaId)
                .filter(tienda ->
                        Boolean.TRUE.equals(
                                tienda.getActivo()
                        )
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "La tienda activa no existe"
                        )
                );
    }
}