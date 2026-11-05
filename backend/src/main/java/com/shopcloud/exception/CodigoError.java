package com.shopcloud.exception;

/**
 * Códigos estables que la API devuelve en el campo "codigo" de los errores
 * para que el cliente no tenga que interpretar los mensajes.
 */
public final class CodigoError {

    public static final String TIENDA_NO_DISPONIBLE = "TIENDA_NO_DISPONIBLE";
    public static final String TIENDA_DESACTIVADA = "TIENDA_DESACTIVADA";
    public static final String SUSCRIPCION_REQUERIDA = "SUSCRIPCION_REQUERIDA";
    public static final String LIMITE_PLAN = "LIMITE_PLAN";
    public static final String FUNCIONALIDAD_NO_INCLUIDA = "FUNCIONALIDAD_NO_INCLUIDA";

    private CodigoError() {
    }
}
