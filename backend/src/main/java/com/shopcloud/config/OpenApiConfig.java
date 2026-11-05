package com.shopcloud.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import org.springdoc.core.customizers.OpenApiCustomizer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME =
            "bearerAuth";

    @Bean
    public OpenAPI shopCloudOpenAPI() {

        return new OpenAPI()

                .info(new Info()
                        .title("ShopCloud API")
                        .version("1.0.0")
                        .description(
                                "API REST de ShopCloud - "
                                + "Plataforma SaaS de comercio electrónico "
                                + "multi-tenant"
                        )
                        .contact(new Contact()
                                .name("Equipo ShopCloud")
                        )
                )

                .addSecurityItem(
                        new SecurityRequirement()
                                .addList(SECURITY_SCHEME_NAME)
                )

                .components(
                        new Components()
                                .addSecuritySchemes(
                                        SECURITY_SCHEME_NAME,
                                        new SecurityScheme()
                                                .type(
                                                        SecurityScheme.Type.HTTP
                                                )
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );
    }

    @Bean
    public OpenApiCustomizer tenantHeaderCustomizer() {

        return openApi -> {

            if (openApi.getPaths() == null) {
                return;
            }

            openApi.getPaths()
                    .forEach((path, pathItem) -> {

                        if (!requiereTenant(path)) {
                            return;
                        }

                        pathItem.readOperations()
                                .forEach(operation -> {

                                    Parameter tenantHeader =
                                            new Parameter()
                                                    .in("header")
                                                    .name("X-Tenant-ID")
                                                    .description(
                                                            "ID de la tienda activa"
                                                    )
                                                    .required(true)
                                                    .example(1);

                                    operation.addParametersItem(
                                            tenantHeader
                                    );
                                });
                    });
        };
    }

    private boolean requiereTenant(String path) {

        return path.startsWith("/api/productos")
                || path.startsWith("/api/categorias")
                || path.startsWith("/api/inventario")
                || path.startsWith("/api/descuentos")
                || path.startsWith("/api/clientes")
                || path.startsWith("/api/gestion")
                || path.startsWith("/api/suscripciones")
                || path.startsWith("/api/analitica");
    }
}