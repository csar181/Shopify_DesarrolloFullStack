package com.shopcloud.pedido.service;

import com.shopcloud.carrito.entity.Carrito;
import com.shopcloud.carrito.entity.ElementoCarrito;
import com.shopcloud.carrito.repository.CarritoRepository;
import com.shopcloud.carrito.repository.ElementoCarritoRepository;
import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.entity.Variante;
import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.catalogo.repository.VarianteRepository;
import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.entity.Direccion;
import com.shopcloud.cliente.repository.DireccionRepository;
import com.shopcloud.cliente.service.ClienteService;
import com.shopcloud.cliente.service.DatosComprobante;
import com.shopcloud.cliente.service.DatosFacturacionService;
import com.shopcloud.descuento.entity.Descuento;
import com.shopcloud.descuento.service.DescuentoAplicado;
import com.shopcloud.descuento.service.DescuentoService;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.inventario.entity.Inventario;
import com.shopcloud.inventario.repository.InventarioRepository;
import com.shopcloud.pago.entity.MetodoPago;
import com.shopcloud.pago.entity.Transaccion;
import com.shopcloud.pago.repository.MetodoPagoRepository;
import com.shopcloud.pago.repository.TransaccionRepository;
import com.shopcloud.pedido.dto.CheckoutDTO;
import com.shopcloud.pedido.dto.PedidoRespuestaDTO;
import com.shopcloud.pedido.dto.ResumenCheckoutDTO;
import com.shopcloud.pedido.entity.ElementoPedido;
import com.shopcloud.pedido.entity.Pedido;
import com.shopcloud.pedido.repository.ElementoPedidoRepository;
import com.shopcloud.pedido.repository.PedidoRepository;
import com.shopcloud.plan.service.AccesoTiendaService;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Compra completa en una sola transacción: si algo falla no queda pedido, transacción
 * ni stock descontado. Todo importe se calcula aquí a partir del catálogo.
 */
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final AccesoTiendaService accesoTiendaService;
    private final ClienteService clienteService;
    private final CarritoRepository carritoRepository;
    private final ElementoCarritoRepository elementoCarritoRepository;
    private final DireccionRepository direccionRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final DatosFacturacionService datosFacturacionService;
    private final ProductoRepository productoRepository;
    private final VarianteRepository varianteRepository;
    private final InventarioRepository inventarioRepository;
    private final DescuentoService descuentoService;
    private final PedidoRepository pedidoRepository;
    private final ElementoPedidoRepository elementoPedidoRepository;
    private final TransaccionRepository transaccionRepository;
    private final PedidoService pedidoService;
    private final TenantService tenantService;

    /** Previsualiza los importes sin reservar stock ni registrar nada. */
    @Transactional(readOnly = true)
    public ResumenCheckoutDTO obtenerResumen(String codigoDescuento) {
        Long tiendaId = tenantService.obtenerTenantId();
        Cliente cliente = clienteService.obtenerClienteActual();

        Carrito carrito = carritoRepository
                .findByClienteIdAndTiendaIdAndEstado(cliente.getId(), tiendaId, Carrito.ESTADO_ACTIVO)
                .orElseThrow(this::carritoVacio);

        List<ElementoCarrito> elementos = obtenerElementos(carrito);

        BigDecimal subtotal = elementos.stream()
                .map(elemento -> {
                    Producto producto = buscarProducto(elemento, tiendaId);
                    Variante variante = buscarVariante(elemento, producto);
                    return precio(producto, variante)
                            .multiply(BigDecimal.valueOf(elemento.getCantidad()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montoDescuento = BigDecimal.ZERO;
        String codigo = null;

        if (tieneTexto(codigoDescuento)) {
            DescuentoAplicado aplicado = descuentoService.aplicar(codigoDescuento, tiendaId, subtotal);
            montoDescuento = aplicado.monto();
            codigo = aplicado.descuento().getCodigo();
        }

        DesgloseImportes desglose = DesgloseImportes.calcular(subtotal, montoDescuento);

        return ResumenCheckoutDTO.builder()
                .subtotal(desglose.subtotal())
                .codigoDescuento(codigo)
                .montoDescuento(desglose.montoDescuento())
                .baseImponible(desglose.baseImponible())
                .porcentajeIgv(DesgloseImportes.PORCENTAJE_IGV)
                .montoIgv(desglose.montoIgv())
                .total(desglose.total())
                .build();
    }

    @Transactional
    public PedidoRespuestaDTO realizarCheckout(CheckoutDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();
        accesoTiendaService.exigirPublicada(tiendaId);

        Cliente cliente = clienteService.obtenerClienteActual();

        Carrito carrito = carritoRepository
                .findWithLockByClienteIdAndTiendaIdAndEstado(
                        cliente.getId(), tiendaId, Carrito.ESTADO_ACTIVO)
                .orElseThrow(this::carritoVacio);

        List<ElementoCarrito> elementos = obtenerElementos(carrito);

        Direccion direccion = direccionRepository
                .findByIdAndClienteId(dto.getDireccionId(), cliente.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Dirección no encontrada para el cliente actual"));

        MetodoPago metodoPago = metodoPagoRepository
                .findByIdAndTiendaIdAndActivoTrue(dto.getMetodoPagoId(), tiendaId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Método de pago activo no encontrado en la tienda"));

        DatosComprobante comprobante = datosFacturacionService.resolverParaCheckout(
                cliente,
                dto.getTipoComprobante(),
                dto.getDatosFacturacionId(),
                dto.getNumeroDocumento(),
                dto.getNombreRazonSocial(),
                dto.getDireccionFiscal(),
                dto.getGuardarDatosFacturacion()
        );

        // El inventario se bloquea siempre en el mismo orden para evitar interbloqueos.
        List<LineaCheckout> lineas = elementos.stream()
                .sorted(Comparator
                        .comparing((ElementoCarrito e) -> e.getProducto().getId())
                        .thenComparing(e -> e.getVariante() != null
                                ? e.getVariante().getId() : Long.MIN_VALUE))
                .map(elemento -> prepararLinea(elemento, tiendaId))
                .toList();

        BigDecimal subtotal = lineas.stream()
                .map(LineaCheckout::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DescuentoAplicado descuento = tieneTexto(dto.getCodigoDescuento())
                ? descuentoService.aplicar(dto.getCodigoDescuento(), tiendaId, subtotal)
                : null;

        DesgloseImportes desglose = DesgloseImportes.calcular(
                subtotal, descuento != null ? descuento.monto() : BigDecimal.ZERO);

        Pedido pedido = pedidoRepository.save(
                construirPedido(cliente, direccion, comprobante, descuento, desglose));

        // El número depende del ID, por lo que se asigna después de guardar.
        pedido.setNumeroComprobante(generarNumeroComprobante(pedido));

        elementoPedidoRepository.saveAll(
                lineas.stream().map(linea -> construirElemento(pedido, linea)).toList());

        lineas.forEach(linea -> linea.inventario().setCantidad(
                linea.inventario().getCantidad() - linea.cantidad()));

        Transaccion transaccion = transaccionRepository.save(
                Transaccion.builder()
                        .tienda(pedido.getTienda())
                        .pedido(pedido)
                        .metodoPago(metodoPago)
                        .monto(pedido.getTotal())
                        .estado(Transaccion.ESTADO_REALIZADA)
                        .referenciaTransaccion("SIM-" + UUID.randomUUID().toString().toUpperCase())
                        .build()
        );

        carrito.setEstado(Carrito.ESTADO_CONVERTIDO);
        carrito.setTotal(subtotal);

        return pedidoService.convertirRespuesta(pedido, transaccion);
    }

    private List<ElementoCarrito> obtenerElementos(Carrito carrito) {
        List<ElementoCarrito> elementos =
                elementoCarritoRepository.findByCarritoIdOrderById(carrito.getId());

        if (elementos.isEmpty()) {
            throw carritoVacio();
        }
        return elementos;
    }

    private ReglaNegocioException carritoVacio() {
        return new ReglaNegocioException("El carrito está vacío");
    }

    private LineaCheckout prepararLinea(ElementoCarrito elemento, Long tiendaId) {
        Producto producto = buscarProducto(elemento, tiendaId);
        Variante variante = buscarVariante(elemento, producto);

        Inventario inventario = (variante == null
                ? inventarioRepository.findWithLockByTiendaIdAndProductoIdAndVarianteIsNull(
                        tiendaId, producto.getId())
                : inventarioRepository.findWithLockByTiendaIdAndProductoIdAndVarianteId(
                        tiendaId, producto.getId(), variante.getId()))
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Inventario no configurado para " + producto.getNombre()));

        if (inventario.getCantidad() < elemento.getCantidad()) {
            throw new ReglaNegocioException(
                    "Stock insuficiente para " + producto.getNombre()
                            + ". Disponible: " + inventario.getCantidad());
        }

        BigDecimal precio = precio(producto, variante);

        return new LineaCheckout(
                producto, variante, inventario, elemento.getCantidad(), precio,
                precio.multiply(BigDecimal.valueOf(elemento.getCantidad())));
    }

    private Producto buscarProducto(ElementoCarrito elemento, Long tiendaId) {
        return productoRepository
                .findByIdAndTiendaIdAndActivoTrue(elemento.getProducto().getId(), tiendaId)
                .orElseThrow(() -> new ReglaNegocioException(
                        "Un producto del carrito ya no está disponible"));
    }

    private Variante buscarVariante(ElementoCarrito elemento, Producto producto) {
        if (elemento.getVariante() == null) {
            return null;
        }
        return varianteRepository
                .findByIdAndProductoIdAndActivoTrue(elemento.getVariante().getId(), producto.getId())
                .orElseThrow(() -> new ReglaNegocioException(
                        "Una variante del carrito ya no está disponible"));
    }

    private BigDecimal precio(Producto producto, Variante variante) {
        return variante != null ? variante.precioEfectivo() : producto.getPrecio();
    }

    private Pedido construirPedido(
            Cliente cliente,
            Direccion direccion,
            DatosComprobante comprobante,
            DescuentoAplicado aplicado,
            DesgloseImportes desglose
    ) {
        Descuento descuento = aplicado != null ? aplicado.descuento() : null;

        return Pedido.builder()
                .tienda(cliente.getTienda())
                .cliente(cliente)
                .direccion(direccion)
                .descuento(descuento)
                .datosFacturacion(comprobante.datosFacturacion())
                .estado(Pedido.ESTADO_CONFIRMADO)
                .subtotal(desglose.subtotal())
                .montoDescuento(desglose.montoDescuento())
                .baseImponible(desglose.baseImponible())
                .porcentajeIgv(DesgloseImportes.PORCENTAJE_IGV)
                .montoIgv(desglose.montoIgv())
                .total(desglose.total())
                .envioLineaDireccion(direccion.getLineaDireccion())
                .envioCiudad(direccion.getCiudad())
                .envioDistrito(direccion.getDistrito())
                .envioDepartamento(direccion.getDepartamento())
                .envioCodigoPostal(direccion.getCodigoPostal())
                .envioReferencia(direccion.getReferencia())
                .codigoDescuento(descuento != null ? descuento.getCodigo() : null)
                .tipoDescuento(descuento != null ? descuento.getTipo() : null)
                .valorDescuento(descuento != null ? descuento.getValor() : null)
                .tipoComprobante(comprobante.tipoComprobante())
                .tipoDocumento(comprobante.tipoDocumento())
                .numeroDocumento(comprobante.numeroDocumento())
                .nombreRazonSocial(comprobante.nombreRazonSocial())
                .direccionFiscal(comprobante.direccionFiscal())
                .estadoComprobante(Pedido.COMPROBANTE_GENERADO)
                .build();
    }

    private ElementoPedido construirElemento(Pedido pedido, LineaCheckout linea) {
        return ElementoPedido.builder()
                .tienda(pedido.getTienda())
                .pedido(pedido)
                .producto(linea.producto())
                .variante(linea.variante())
                .nombreProducto(linea.producto().getNombre())
                .nombreVariante(linea.variante() != null ? linea.variante().getNombre() : null)
                .sku(linea.variante() != null && linea.variante().getSku() != null
                        ? linea.variante().getSku()
                        : linea.producto().getSku())
                .cantidad(linea.cantidad())
                .precioUnitario(linea.precioUnitario())
                .subtotal(linea.subtotal())
                .build();
    }

    private String generarNumeroComprobante(Pedido pedido) {
        String serie = Pedido.COMPROBANTE_FACTURA.equals(pedido.getTipoComprobante())
                ? "F001"
                : "B001";
        return String.format("%s-%08d", serie, pedido.getId());
    }

    private boolean tieneTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private record LineaCheckout(
            Producto producto,
            Variante variante,
            Inventario inventario,
            int cantidad,
            BigDecimal precioUnitario,
            BigDecimal subtotal
    ) {
    }
}
