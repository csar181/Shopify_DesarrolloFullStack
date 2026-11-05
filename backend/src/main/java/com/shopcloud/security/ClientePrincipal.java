package com.shopcloud.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

/** Cliente autenticado: su sesión solo es válida dentro de una tienda. */
@Getter
@RequiredArgsConstructor
public class ClientePrincipal {

    public static final String ROL_CLIENTE = "CLIENTE";

    private final Long id;
    private final Long tiendaId;

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + ROL_CLIENTE));
    }
}
