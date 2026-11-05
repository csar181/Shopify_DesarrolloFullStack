package com.shopcloud.tenant;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class TenantConfig implements WebMvcConfigurer {

    private final TenantInterceptor tenantInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor)
                .addPathPatterns(
                        // Propietario
                        "/api/productos/**",
                        "/api/categorias/**",
                        "/api/inventario/**",
                        "/api/descuentos/**",
                        "/api/clientes/**",
                        "/api/analitica/**",
                        "/api/suscripciones/**",
                        "/api/gestion/**",
                        // Cliente
                        "/api/mi-cuenta/**",
                        "/api/carrito/**",
                        "/api/checkout/**",
                        "/api/pedidos/**",
                        "/api/pagos/**"
                );
    }
}
