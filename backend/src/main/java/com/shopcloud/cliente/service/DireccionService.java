package com.shopcloud.cliente.service;

import com.shopcloud.cliente.dto.DireccionDTO;
import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.entity.Direccion;
import com.shopcloud.cliente.repository.DireccionRepository;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.pedido.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DireccionService {

    private final DireccionRepository direccionRepository;
    private final PedidoRepository pedidoRepository;
    private final ClienteService clienteService;

    @Transactional
    public DireccionDTO crearParaClienteActual(DireccionDTO dto) {
        Cliente cliente = clienteService.obtenerClienteActual();

        Direccion direccion = Direccion.builder()
                .tienda(cliente.getTienda())
                .cliente(cliente)
                .build();
        copiarDatos(dto, direccion);

        return convertirDTO(direccionRepository.save(direccion));
    }

    @Transactional(readOnly = true)
    public List<DireccionDTO> listarDelClienteActual() {
        return direccionRepository.findByClienteId(clienteService.obtenerClienteActual().getId())
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional
    public DireccionDTO actualizarDelClienteActual(Long direccionId, DireccionDTO dto) {
        Direccion direccion = buscarDireccion(
                clienteService.obtenerClienteActual().getId(), direccionId);
        copiarDatos(dto, direccion);
        return convertirDTO(direccionRepository.save(direccion));
    }

    /** Los pedidos guardan una copia de la dirección, pero la clave foránea impide borrarla. */
    @Transactional
    public void eliminarDelClienteActual(Long direccionId) {
        Direccion direccion = buscarDireccion(
                clienteService.obtenerClienteActual().getId(), direccionId);

        if (pedidoRepository.existsByDireccionId(direccion.getId())) {
            throw new ReglaNegocioException(
                    "No se puede eliminar una dirección utilizada en un pedido");
        }
        direccionRepository.delete(direccion);
    }

    @Transactional(readOnly = true)
    public List<DireccionDTO> listar(Long clienteId) {
        // Comprueba que el cliente pertenece a la tienda actual.
        clienteService.buscarCliente(clienteId);

        return direccionRepository.findByClienteId(clienteId)
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    private Direccion buscarDireccion(Long clienteId, Long direccionId) {
        return direccionRepository.findByIdAndClienteId(direccionId, clienteId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Dirección no encontrada"));
    }

    private DireccionDTO convertirDTO(Direccion direccion) {
        return DireccionDTO.builder()
                .id(direccion.getId())
                .lineaDireccion(direccion.getLineaDireccion())
                .ciudad(direccion.getCiudad())
                .distrito(direccion.getDistrito())
                .departamento(direccion.getDepartamento())
                .codigoPostal(direccion.getCodigoPostal())
                .referencia(direccion.getReferencia())
                .build();
    }

    private void copiarDatos(DireccionDTO dto, Direccion direccion) {
        direccion.setLineaDireccion(dto.getLineaDireccion().trim());
        direccion.setCiudad(dto.getCiudad().trim());
        direccion.setDistrito(limpiar(dto.getDistrito()));
        direccion.setDepartamento(limpiar(dto.getDepartamento()));
        direccion.setCodigoPostal(limpiar(dto.getCodigoPostal()));
        direccion.setReferencia(limpiar(dto.getReferencia()));
    }

    private String limpiar(String valor) {
        if (valor == null) {
            return null;
        }
        String resultado = valor.trim();
        return resultado.isEmpty() ? null : resultado;
    }
}
