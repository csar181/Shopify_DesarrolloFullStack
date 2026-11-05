package com.shopcloud.auth.service;

import com.shopcloud.auth.dto.AuthRespuestaDTO;
import com.shopcloud.auth.dto.LoginDTO;
import com.shopcloud.auth.dto.RegistroDTO;
import com.shopcloud.auth.dto.UsuarioRespuestaDTO;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.security.UsuarioPrincipal;
import com.shopcloud.security.jwt.JwtService;
import com.shopcloud.usuario.entity.Usuario;
import com.shopcloud.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Autenticación de propietarios. Los clientes se autentican por tienda. */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final List<String> ROLES = List.of(UsuarioPrincipal.ROL_PROPIETARIO);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthRespuestaDTO registrar(RegistroDTO dto) {
        String correo = dto.getCorreoElectronico().trim().toLowerCase();

        if (usuarioRepository.existsByCorreoElectronico(correo)) {
            throw new ReglaNegocioException("El correo electrónico ya está registrado");
        }

        Usuario usuario = usuarioRepository.save(
                Usuario.builder()
                        .nombre(dto.getNombre().trim())
                        .correoElectronico(correo)
                        .contrasena(passwordEncoder.encode(dto.getContrasena()))
                        .activo(true)
                        .build()
        );
        return construirRespuesta(usuario);
    }

    public AuthRespuestaDTO login(LoginDTO dto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        dto.getCorreoElectronico().trim().toLowerCase(),
                        dto.getContrasena()
                )
        );
        UsuarioPrincipal principal = (UsuarioPrincipal) authentication.getPrincipal();
        return construirRespuesta(principal.getUsuario());
    }

    @Transactional(readOnly = true)
    public UsuarioRespuestaDTO obtenerUsuarioActual(UsuarioPrincipal principal) {
        Usuario usuario = usuarioRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return UsuarioRespuestaDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .correoElectronico(usuario.getCorreoElectronico())
                .activo(usuario.getActivo())
                .roles(ROLES)
                .build();
    }

    private AuthRespuestaDTO construirRespuesta(Usuario usuario) {
        return AuthRespuestaDTO.builder()
                .token(jwtService.generarTokenUsuario(usuario.getId()))
                .tipo("Bearer")
                .usuarioId(usuario.getId())
                .nombre(usuario.getNombre())
                .correoElectronico(usuario.getCorreoElectronico())
                .roles(ROLES)
                .build();
    }
}
