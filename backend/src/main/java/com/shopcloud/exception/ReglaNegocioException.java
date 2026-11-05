package com.shopcloud.exception;

import lombok.Getter;

@Getter
public class ReglaNegocioException extends RuntimeException {

    private final String codigo;

    public ReglaNegocioException(String mensaje) {
        this(mensaje, null);
    }

    public ReglaNegocioException(String mensaje, String codigo) {
        super(mensaje);
        this.codigo = codigo;
    }
}
