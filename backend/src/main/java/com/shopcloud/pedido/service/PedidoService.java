package com.shopcloud.pedido.service;

import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.service.ClienteService;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.inventario.repository.InventarioRepository;
import com.shopcloud.pago.dto.TransaccionDTO;
import com.shopcloud.pago.entity.Transaccion;
import com.shopcloud.pago.repository.TransaccionRepository;
import com.shopcloud.pedido.dto.ActualizarEstadoPedidoDTO;
import com.shopcloud.pedido.dto.ComprobanteDTO;
import com.shopcloud.pedido.dto.ElementoPedidoDTO;
import com.shopcloud.pedido.dto.PedidoDTO;
import com.shopcloud.pedido.dto.PedidoRespuestaDTO;
import com.shopcloud.pedido.entity.ElementoPedido;
import com.shopcloud.pedido.entity.Pedido;
import com.shopcloud.pedido.repository.ElementoPedidoRepository;
import com.shopcloud.pedido.repository.PedidoRepository;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Los pedidos y sus transacciones nunca se eliminan: cancelar los anula y conserva. */
@Service
@RequiredArgsConstructor
public class PedidoService {

    private static final Map<String, Set<String>> TRANSICIONES = Map.of(
            Pedido.ESTADO_PENDIENTE, Set.of(Pedido.ESTADO_CONFIRMADO, Pedido.ESTADO_CANCELADO),
            Pedido.ESTADO_CONFIRMADO, Set.of(Pedido.ESTADO_PREPARANDO, Pedido.ESTADO_CANCELADO),
            Pedido.ESTADO_PREPARANDO, Set.of(Pedido.ESTADO_ENVIADO, Pedido.ESTADO_CANCELADO),
            Pedido.ESTADO_ENVIADO, Set.of(Pedido.ESTADO_ENTREGADO)
    );

    private final PedidoRepository pedidoRepository;
    private final ElementoPedidoRepository elementoPedidoRepository;
    private final TransaccionRepository transaccionRepository;
    private final InventarioRepository inventarioRepository;
    private final ClienteService clienteService;
    private final TenantService tenantService;

    @Transactional(readOnly = true)
    public List<PedidoDTO> listarDelClienteActual() {
        return pedidoRepository
                .findByClienteIdAndTiendaIdOrderByCreadoEnDesc(
                        clienteService.obtenerClienteActual().getId(),
                        tenantService.obtenerTenantId())
                .stream()
                .map(this::convertirResumen)
                .toList();
    }

    @Transactional(readOnly = true)
    public PedidoRespuestaDTO obtenerDelClienteActual(Long pedidoId) {
        Cliente cliente = clienteService.obtenerClienteActual();

        return pedidoRepository
                .findByIdAndClienteIdAndTiendaId(pedidoId, cliente.getId(), tenantService.obtenerTenantId())
                .map(this::convertirRespuesta)
                .orElseThrow(this::noEncontrado);
    }

    @Transactional(readOnly = true)
    public List<PedidoDTO> listarDeLaTienda(String estado) {
        Long tiendaId = tenantService.obtenerTenantId();

        List<Pedido> pedidos = estado == null || estado.isBlank()
                ? pedidoRepository.findByTiendaIdOrderByCreadoEnDesc(tiendaId)
                : pedidoRepository.findByTiendaIdAndEstadoOrderByCreadoEnDesc(
                        tiendaId, estado.trim().toUpperCase());

        return pedidos.stream().map(this::convertirResumen).toList();
    }

    @Transactional(readOnly = true)
    public PedidoRespuestaDTO obtenerDeLaTienda(Long pedidoId) {
        return pedidoRepository.findByIdAndTiendaId(pedidoId, tenantService.obtenerTenantId())
                .map(this::convertirRespuesta)
                .orElseThrow(this::noEncontrado);
    }

    @Transactional
    public PedidoRespuestaDTO actualizarEstado(Long pedidoId, ActualizarEstadoPedidoDTO dto) {
        Pedido pedido = pedidoRepository
                .findWithLockByIdAndTiendaId(pedidoId, tenantService.obtenerTenantId())
                .orElseThrow(this::noEncontrado);

        String nuevoEstado = dto.getEstado().trim().toUpperCase();

        if (!TRANSICIONES.getOrDefault(pedido.getEstado(), Set.of()).contains(nuevoEstado)) {
            throw new ReglaNegocioException(
                    "Un pedido " + pedido.getEstado() + " no puede pasar a " + nuevoEstado);
        }

        if (Pedido.ESTADO_CANCELADO.equals(nuevoEstado)) {
            anular(pedido);
        }

        pedido.setEstado(nuevoEstado);
        return convertirRespuesta(pedidoRepository.save(pedido));
    }

    private void anular(Pedido pedido) {
        pedido.setEstadoComprobante(Pedido.COMPROBANTE_ANULADO);

        transaccionRepository.findByPedidoId(pedido.getId())
                .ifPresent(transaccion -> transaccion.setEstado(Transaccion.ESTADO_ANULADA));

        Long tiendaId = pedido.getTienda().getId();

        elementoPedidoRepository.findByPedidoIdOrderById(pedido.getId())
                .stream()
                .sorted(Comparator
                        .comparing((ElementoPedido e) -> e.getProducto().getId())
                        .thenComparing(e -> e.getVariante() != null
                                ? e.getVariante().getId() : Long.MIN_VALUE))
                .forEach(elemento -> (elemento.getVariante() == null
                        ? inventarioRepository.findWithLockByTiendaIdAndProductoIdAndVarianteIsNull(
                                tiendaId, elemento.getProducto().getId())
                        : inventarioRepository.findWithLockByTiendaIdAndProductoIdAndVarianteId(
                                tiendaId, elemento.getProducto().getId(), elemento.getVariante().getId()))
                        .ifPresent(inventario -> inventario.setCantidad(
                                inventario.getCantidad() + elemento.getCantidad())));
    }

    public PedidoRespuestaDTO convertirRespuesta(Pedido pedido) {
        return convertirRespuesta(
                pedido,
                transaccionRepository.findByPedidoId(pedido.getId()).orElse(null));
    }

    public PedidoRespuestaDTO convertirRespuesta(Pedido pedido, Transaccion transaccion) {
        List<ElementoPedidoDTO> elementos = elementoPedidoRepository
                .findByPedidoIdOrderById(pedido.getId())
                .stream()
                .map(this::convertirElemento)
                .toList();

        return PedidoRespuestaDTO.builder()
                .id(pedido.getId())
                .estado(pedido.getEstado())
                .clienteId(pedido.getCliente().getId())
                .clienteNombre(pedido.getCliente().getNombre())
                .subtotal(pedido.getSubtotal())
                .codigoDescuento(pedido.getCodigoDescuento())
                .tipoDescuento(pedido.getTipoDescuento())
                .valorDescuento(pedido.getValorDescuento())
                .montoDescuento(pedido.getMontoDescuento())
                .baseImponible(pedido.getBaseImponible())
                .porcentajeIgv(pedido.getPorcentajeIgv())
                .montoIgv(pedido.getMontoIgv())
                .total(pedido.getTotal())
                .lineaDireccion(pedido.getEnvioLineaDireccion())
                .ciudad(pedido.getEnvioCiudad())
                .distrito(pedido.getEnvioDistrito())
                .departamento(pedido.getEnvioDepartamento())
                .codigoPostal(pedido.getEnvioCodigoPostal())
                .referencia(pedido.getEnvioReferencia())
                .comprobante(ComprobanteDTO.builder()
                        .tipo(pedido.getTipoComprobante())
                        .numero(pedido.getNumeroComprobante())
                        .estado(pedido.getEstadoComprobante())
                        .tipoDocumento(pedido.getTipoDocumento())
                        .numeroDocumento(pedido.getNumeroDocumento())
                        .nombreRazonSocial(pedido.getNombreRazonSocial())
                        .direccionFiscal(pedido.getDireccionFiscal())
                        .build())
                .transaccion(transaccion != null ? TransaccionDTO.desde(transaccion) : null)
                .elementos(elementos)
                .creadoEn(pedido.getCreadoEn())
                .actualizadoEn(pedido.getActualizadoEn())
                .build();
    }

    private RecursoNoEncontradoException noEncontrado() {
        return new RecursoNoEncontradoException("Pedido no encontrado");
    }

    private PedidoDTO convertirResumen(Pedido pedido) {
        return PedidoDTO.builder()
                .id(pedido.getId())
                .estado(pedido.getEstado())
                .total(pedido.getTotal())
                .tipoComprobante(pedido.getTipoComprobante())
                .numeroComprobante(pedido.getNumeroComprobante())
                .clienteId(pedido.getCliente().getId())
                .clienteNombre(pedido.getCliente().getNombre())
                .creadoEn(pedido.getCreadoEn())
                .build();
    }

    private ElementoPedidoDTO convertirElemento(ElementoPedido elemento) {
        return ElementoPedidoDTO.builder()
                .id(elemento.getId())
                .productoId(elemento.getProducto().getId())
                .nombreProducto(elemento.getNombreProducto())
                .varianteId(elemento.getVariante() != null ? elemento.getVariante().getId() : null)
                .nombreVariante(elemento.getNombreVariante())
                .sku(elemento.getSku())
                .cantidad(elemento.getCantidad())
                .precioUnitario(elemento.getPrecioUnitario())
                .subtotal(elemento.getSubtotal())
                .build();
    }
}
