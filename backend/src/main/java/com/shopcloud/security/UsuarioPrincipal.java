package com.shopcloud.security;

import com.shopcloud.usuario.entity.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Propietario autenticado. Su relación con cada tienda se valida siempre contra
 * tiendas.propietario_id; el rol solo lo distingue de una cuenta de cliente.
 */
public class UsuarioPrincipal implements UserDetails {

    public static final String ROL_PROPIETARIO = "PROPIETARIO_TIENDA";

    private final Usuario usuario;

    public UsuarioPrincipal(Usuario usuario) {
        this.usuario = usuario;
    }

    public Long getId() {
        return usuario.getId();
    }

    public String getNombre() {
        return usuario.getNombre();
    }

    public Usuario getUsuario() {
        return usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + ROL_PROPIETARIO));
    }

    @Override
    public String getPassword() {
        return usuario.getContrasena();
    }

    @Override
    public String getUsername() {
        return usuario.getCorreoElectronico();
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(usuario.getActivo());
    }
}
