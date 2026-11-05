package com.shopcloud.security.jwt;

import com.shopcloud.cliente.repository.ClienteRepository;
import com.shopcloud.security.ClientePrincipal;
import com.shopcloud.security.UsuarioPrincipal;
import com.shopcloud.usuario.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                autenticar(authHeader.substring(7), request);
            } catch (Exception ignored) {
                // Un JWT inválido no autentica: Spring Security decide si la ruta es pública.
            }
        }

        filterChain.doFilter(request, response);
    }

    private void autenticar(String token, HttpServletRequest request) {
        Claims claims = jwtService.validar(token);
        Long id = Long.valueOf(claims.getSubject());
        String tipo = claims.get(JwtService.CLAIM_TIPO, String.class);

        UsernamePasswordAuthenticationToken autenticacion = null;

        if (JwtService.TIPO_USUARIO.equals(tipo)) {
            autenticacion = usuarioRepository.findById(id)
                    .map(UsuarioPrincipal::new)
                    .filter(UsuarioPrincipal::isEnabled)
                    .map(principal -> new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities()))
                    .orElse(null);
        } else if (JwtService.TIPO_CLIENTE.equals(tipo)) {
            Long tiendaId = claims.get(JwtService.CLAIM_TIENDA, Long.class);
            autenticacion = clienteRepository.findByIdAndTiendaId(id, tiendaId)
                    .filter(cliente -> Boolean.TRUE.equals(cliente.getActivo()))
                    .map(cliente -> new ClientePrincipal(id, tiendaId))
                    .map(principal -> new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities()))
                    .orElse(null);
        }

        if (autenticacion != null) {
            autenticacion.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(autenticacion);
        }
    }
}
