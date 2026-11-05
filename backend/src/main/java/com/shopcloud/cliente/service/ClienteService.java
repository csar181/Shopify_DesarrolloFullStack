package com.shopcloud.cliente.service;

import com.shopcloud.cliente.dto.ActualizarPerfilClienteDTO;
import com.shopcloud.cliente.dto.ClienteDTO;
import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.repository.ClienteRepository;
import com.shopcloud.exception.AccesoDenegadoException;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.security.ClientePrincipal;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final TenantService tenantService;

    /** El cliente de la sesión, siempre dentro de la tienda del contexto. */
    @Transactional(readOnly = true)
    public Cliente obtenerClienteActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof ClientePrincipal principal)) {
            throw new AccesoDenegadoException("Cliente no autenticado");
        }

        return clienteRepository
                .findByIdAndTiendaId(principal.getId(), tenantService.obtenerTenantId())
                .orElseThrow(() -> new AccesoDenegadoException(
                        "La sesión no pertenece a esta tienda"));
    }

    @Transactional(readOnly = true)
    public ClienteDTO obtenerPerfil() {
        return convertirDTO(obtenerClienteActual());
    }

    @Transactional
    public ClienteDTO actualizarPerfil(ActualizarPerfilClienteDTO dto) {
        Cliente cliente = obtenerClienteActual();
        cliente.setNombre(dto.getNombre().trim());
        cliente.setTelefono(dto.getTelefono());
        return convertirDTO(clienteRepository.save(cliente));
    }

    @Transactional(readOnly = true)
    public List<ClienteDTO> listar() {
        return clienteRepository.findByTiendaId(tenantService.obtenerTenantId())
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteDTO obtener(Long id) {
        return convertirDTO(buscarCliente(id));
    }

    @Transactional(readOnly = true)
    public Cliente buscarCliente(Long id) {
        return clienteRepository.findByIdAndTiendaId(id, tenantService.obtenerTenantId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado"));
    }

    private ClienteDTO convertirDTO(Cliente cliente) {
        return ClienteDTO.builder()
                .id(cliente.getId())
                .nombre(cliente.getNombre())
                .correoElectronico(cliente.getCorreoElectronico())
                .telefono(cliente.getTelefono())
                .build();
    }
}
