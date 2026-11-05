package com.shopcloud.cliente.service;

import com.shopcloud.cliente.dto.ClienteAuthRespuestaDTO;
import com.shopcloud.cliente.dto.RegistroClienteDTO;
import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.repository.ClienteRepository;
import com.shopcloud.auth.dto.LoginDTO;
import com.shopcloud.exception.AccesoTiendaException;
import com.shopcloud.exception.CodigoError;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.plan.service.AccesoTiendaService;
import com.shopcloud.security.jwt.JwtService;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cada cuenta de cliente pertenece a una sola tienda. El mismo correo puede
 * registrarse en varias tiendas, con cuentas y datos independientes.
 */
@Service
@RequiredArgsConstructor
public class ClienteAuthService {

    private final ClienteRepository clienteRepository;
    private final TiendaRepository tiendaRepository;
    private final AccesoTiendaService accesoTiendaService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public ClienteAuthRespuestaDTO registrar(String slug, RegistroClienteDTO dto) {
        Tienda tienda = buscarTienda(slug);

        if (!accesoTiendaService.estaPublicada(tienda)) {
            throw tiendaNoDisponible();
        }

        String correo = normalizarCorreo(dto.getCorreoElectronico());

        if (clienteRepository.existsByTiendaIdAndCorreoElectronico(tienda.getId(), correo)) {
            throw new ReglaNegocioException("El correo electrónico ya está registrado en esta tienda");
        }

        Cliente cliente = clienteRepository.save(
                Cliente.builder()
                        .tienda(tienda)
                        .nombre(dto.getNombre().trim())
                        .correoElectronico(correo)
                        .contrasena(passwordEncoder.encode(dto.getContrasena()))
                        .telefono(dto.getTelefono())
                        .activo(true)
                        .build()
        );
        return construirRespuesta(cliente, tienda);
    }

    /** Se permite con la tienda sin publicar para que el cliente consulte sus pedidos. */
    @Transactional(readOnly = true)
    public ClienteAuthRespuestaDTO login(String slug, LoginDTO dto) {
        Tienda tienda = buscarTienda(slug);

        Cliente cliente = clienteRepository
                .findByTiendaIdAndCorreoElectronico(
                        tienda.getId(), normalizarCorreo(dto.getCorreoElectronico()))
                .filter(encontrado -> Boolean.TRUE.equals(encontrado.getActivo()))
                .filter(encontrado -> passwordEncoder.matches(
                        dto.getContrasena(), encontrado.getContrasena()))
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        return construirRespuesta(cliente, tienda);
    }

    private Tienda buscarTienda(String slug) {
        return tiendaRepository.findBySlug(slug).orElseThrow(this::tiendaNoDisponible);
    }

    private AccesoTiendaException tiendaNoDisponible() {
        return new AccesoTiendaException(
                HttpStatus.NOT_FOUND,
                CodigoError.TIENDA_NO_DISPONIBLE,
                "La tienda no está disponible"
        );
    }

    private String normalizarCorreo(String correo) {
        return correo.trim().toLowerCase();
    }

    private ClienteAuthRespuestaDTO construirRespuesta(Cliente cliente, Tienda tienda) {
        return ClienteAuthRespuestaDTO.builder()
                .token(jwtService.generarTokenCliente(cliente.getId(), tienda.getId()))
                .tipo("Bearer")
                .clienteId(cliente.getId())
                .tiendaId(tienda.getId())
                .tiendaSlug(tienda.getSlug())
                .nombre(cliente.getNombre())
                .correoElectronico(cliente.getCorreoElectronico())
                .build();
    }
}
