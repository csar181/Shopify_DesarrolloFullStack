package com.shopcloud.util;

import java.text.Normalizer;

public final class SlugUtil {

    private SlugUtil() {
    }

    public static String generar(String texto) {

        String normalizado = Normalizer
                .normalize(
                        texto,
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "");

        return normalizado
                .toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}