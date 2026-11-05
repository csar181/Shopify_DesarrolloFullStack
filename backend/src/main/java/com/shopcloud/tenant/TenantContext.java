package com.shopcloud.tenant;

public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT =
            new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setTenantId(Long tiendaId) {

        if (tiendaId == null) {
            throw new IllegalArgumentException(
                    "El ID de la tienda no puede ser nulo"
            );
        }

        CURRENT_TENANT.set(tiendaId);
    }

    public static Long getTenantId() {

        Long tiendaId = CURRENT_TENANT.get();

        if (tiendaId == null) {
            throw new IllegalStateException(
                    "No existe una tienda activa en el contexto"
            );
        }

        return tiendaId;
    }

    public static Long getTenantIdOrNull() {
        return CURRENT_TENANT.get();
    }

    public static boolean hasTenant() {
        return CURRENT_TENANT.get() != null;
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}