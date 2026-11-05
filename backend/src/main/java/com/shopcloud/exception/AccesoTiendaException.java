package com.shopcloud.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** La tienda existe, pero su situación comercial impide la operación. */
@Getter
public class AccesoTiendaException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    public AccesoTiendaException(HttpStatus status, String codigo, String mensaje) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
    }
}
