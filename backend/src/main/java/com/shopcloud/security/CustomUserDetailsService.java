package com.shopcloud.security;

import com.shopcloud.usuario.entity.Usuario;
import com.shopcloud.usuario.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String correoElectronico)
            throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository
                .findByCorreoElectronico(correoElectronico)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Usuario no encontrado"
                        )
                );

        return new UsuarioPrincipal(usuario);
    }
}