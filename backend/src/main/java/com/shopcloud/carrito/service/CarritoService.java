package com.shopcloud.carrito.service;

import com.shopcloud.carrito.dto.ActualizarCantidadDTO;
import com.shopcloud.carrito.dto.AgregarProductoDTO;
import com.shopcloud.carrito.dto.CarritoDTO;
import com.shopcloud.carrito.dto.ElementoCarritoDTO;
import com.shopcloud.carrito.dto.SincronizarCarritoDTO;
import com.shopcloud.carrito.entity.Carrito;
import com.shopcloud.carrito.entity.ElementoCarrito;
import com.shopcloud.carrito.repository.CarritoRepository;
import com.shopcloud.carrito.repository.ElementoCarritoRepository;
import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.entity.Variante;
import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.catalogo.repository.VarianteRepository;
import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.service.ClienteService;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.inventario.entity.Inventario;
import com.shopcloud.inventario.repository.InventarioRepository;
import com.shopcloud.tenant.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Un carrito ACTIVO por cliente y tienda. Los importes siempre se recalculan con los
 * precios del catálogo; nunca se aceptan desde el frontend.
 */
@Service
@RequiredArgsConstructor
public class CarritoService {

    private final CarritoRepository carritoRepository;
    private final ElementoCarritoRepository elementoRepository;
    private final ClienteService clienteService;
    private final ProductoRepository productoRepository;
    private final VarianteRepository varianteRepository;
    private final InventarioRepository inventarioRepository;
    private final TenantService tenantService;

    @Transactional
    public CarritoDTO obtenerActual() {
        return buscarCarritoActual()
                .map(carrito -> convertirDTO(recalcular(carrito), List.of()))
                .orElseGet(this::carritoVacio);
    }

    @Transactional
    public CarritoDTO agregarProducto(AgregarProductoDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();
        Producto producto = buscarProductoActivo(dto.getProductoId(), tiendaId);
        Variante variante = buscarVarianteActiva(producto, dto.getVarianteId());
        Inventario inventario = buscarInventario(tiendaId, producto.getId(), variante)
                .orElseThrow(this::inventarioNoConfigurado);

        Carrito carrito = obtenerOCrearCarrito();
        Optional<ElementoCarrito> existente =
                buscarElemento(carrito.getId(), producto.getId(), variante);

        int cantidad = dto.getCantidad() + existente.map(ElementoCarrito::getCantidad).orElse(0);
        validarStock(inventario, cantidad);

        guardarElemento(carrito, producto, variante, existente, cantidad);
        return convertirDTO(recalcular(carrito), List.of());
    }

    /**
     * Incorpora el carrito del navegador al iniciar sesión. Se puede repetir sin duplicar
     * cantidades, y lo que ya no se puede vender se omite con una advertencia.
     */
    @Transactional
    public CarritoDTO sincronizar(SincronizarCarritoDTO dto) {
        Long tiendaId = tenantService.obtenerTenantId();
        Carrito carrito = obtenerOCrearCarrito();
        List<String> advertencias = new ArrayList<>();

        for (AgregarProductoDTO item : dto.getElementos()) {
            Optional<Producto> producto =
                    productoRepository.findByIdAndTiendaIdAndActivoTrue(item.getProductoId(), tiendaId);

            if (producto.isEmpty()) {
                advertencias.add("El producto " + item.getProductoId() + " ya no está disponible");
                continue;
            }
            sincronizarElemento(carrito, producto.get(), item, tiendaId, advertencias);
        }
        return convertirDTO(recalcular(carrito), advertencias);
    }

    @Transactional
    public CarritoDTO actualizarCantidad(Long elementoId, ActualizarCantidadDTO dto) {
        Carrito carrito = obtenerCarritoExistente();
        ElementoCarrito elemento = buscarElementoPropio(elementoId, carrito.getId());

        Inventario inventario = buscarInventario(
                tenantService.obtenerTenantId(),
                elemento.getProducto().getId(),
                elemento.getVariante()
        ).orElseThrow(this::inventarioNoConfigurado);

        validarStock(inventario, dto.getCantidad());
        elemento.setCantidad(dto.getCantidad());
        elementoRepository.save(elemento);

        return convertirDTO(recalcular(carrito), List.of());
    }

    @Transactional
    public void eliminarElemento(Long elementoId) {
        Carrito carrito = obtenerCarritoExistente();
        elementoRepository.delete(buscarElementoPropio(elementoId, carrito.getId()));
        elementoRepository.flush();
        recalcular(carrito);
    }

    @Transactional
    public void vaciar() {
        buscarCarritoActual().ifPresent(carrito -> {
            elementoRepository.deleteByCarritoId(carrito.getId());
            elementoRepository.flush();
            recalcular(carrito);
        });
    }

    private void sincronizarElemento(
            Carrito carrito,
            Producto producto,
            AgregarProductoDTO item,
            Long tiendaId,
            List<String> advertencias
    ) {
        Variante variante = null;

        if (item.getVarianteId() != null) {
            variante = varianteRepository
                    .findByIdAndProductoIdAndActivoTrue(item.getVarianteId(), producto.getId())
                    .orElse(null);

            if (variante == null) {
                advertencias.add("Una variante de " + producto.getNombre() + " ya no está disponible");
                return;
            }
        }

        int stock = buscarInventario(tiendaId, producto.getId(), variante)
                .map(Inventario::getCantidad)
                .orElse(0);

        if (stock == 0) {
            advertencias.add(producto.getNombre() + " no tiene stock disponible");
            return;
        }

        Optional<ElementoCarrito> existente =
                buscarElemento(carrito.getId(), producto.getId(), variante);
        int deseada = Math.max(item.getCantidad(), existente.map(ElementoCarrito::getCantidad).orElse(0));
        int cantidad = Math.min(deseada, stock);

        if (cantidad < deseada) {
            advertencias.add("La cantidad de " + producto.getNombre() + " se ajustó al stock disponible");
        }
        guardarElemento(carrito, producto, variante, existente, cantidad);
    }

    private void guardarElemento(
            Carrito carrito,
            Producto producto,
            Variante variante,
            Optional<ElementoCarrito> existente,
            int cantidad
    ) {
        ElementoCarrito elemento = existente.orElseGet(() -> ElementoCarrito.builder()
                .tienda(carrito.getTienda())
                .carrito(carrito)
                .producto(producto)
                .variante(variante)
                .build());

        elemento.setCantidad(cantidad);
        elemento.setPrecioUnitario(precioActual(producto, variante));
        elementoRepository.save(elemento);
    }

    private Carrito recalcular(Carrito carrito) {
        BigDecimal total = BigDecimal.ZERO;

        for (ElementoCarrito elemento : elementoRepository.findByCarritoIdOrderById(carrito.getId())) {
            BigDecimal precio = precioActual(elemento.getProducto(), elemento.getVariante());
            elemento.setPrecioUnitario(precio);
            total = total.add(precio.multiply(BigDecimal.valueOf(elemento.getCantidad())));
        }

        carrito.setTotal(total);
        return carritoRepository.save(carrito);
    }

    private BigDecimal precioActual(Producto producto, Variante variante) {
        return variante != null ? variante.precioEfectivo() : producto.getPrecio();
    }

    private Optional<Carrito> buscarCarritoActual() {
        return carritoRepository.findByClienteIdAndTiendaIdAndEstado(
                clienteService.obtenerClienteActual().getId(),
                tenantService.obtenerTenantId(),
                Carrito.ESTADO_ACTIVO
        );
    }

    private Carrito obtenerCarritoExistente() {
        return buscarCarritoActual()
                .orElseThrow(() -> new RecursoNoEncontradoException("Carrito activo no encontrado"));
    }

    private Carrito obtenerOCrearCarrito() {
        return buscarCarritoActual().orElseGet(() -> {
            Cliente cliente = clienteService.obtenerClienteActual();
            return carritoRepository.save(
                    Carrito.builder()
                            .tienda(cliente.getTienda())
                            .cliente(cliente)
                            .estado(Carrito.ESTADO_ACTIVO)
                            .total(BigDecimal.ZERO)
                            .build()
            );
        });
    }

    private Producto buscarProductoActivo(Long productoId, Long tiendaId) {
        return productoRepository.findByIdAndTiendaIdAndActivoTrue(productoId, tiendaId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Producto activo no encontrado en la tienda"));
    }

    private Variante buscarVarianteActiva(Producto producto, Long varianteId) {
        if (varianteId == null) {
            return null;
        }
        return varianteRepository.findByIdAndProductoIdAndActivoTrue(varianteId, producto.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Variante activa no encontrada para el producto"));
    }

    private Optional<Inventario> buscarInventario(Long tiendaId, Long productoId, Variante variante) {
        return variante == null
                ? inventarioRepository.findByTiendaIdAndProductoIdAndVarianteIsNull(tiendaId, productoId)
                : inventarioRepository.findByTiendaIdAndProductoIdAndVarianteId(
                        tiendaId, productoId, variante.getId());
    }

    private RecursoNoEncontradoException inventarioNoConfigurado() {
        return new RecursoNoEncontradoException(
                "Inventario no configurado para el producto o variante");
    }

    private Optional<ElementoCarrito> buscarElemento(Long carritoId, Long productoId, Variante variante) {
        return variante == null
                ? elementoRepository.findByCarritoIdAndProductoIdAndVarianteIsNull(carritoId, productoId)
                : elementoRepository.findByCarritoIdAndProductoIdAndVarianteId(
                        carritoId, productoId, variante.getId());
    }

    private ElementoCarrito buscarElementoPropio(Long elementoId, Long carritoId) {
        return elementoRepository.findByIdAndCarritoId(elementoId, carritoId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Elemento no encontrado en el carrito actual"));
    }

    private void validarStock(Inventario inventario, int cantidadSolicitada) {
        if (cantidadSolicitada > inventario.getCantidad()) {
            throw new ReglaNegocioException(
                    "Stock insuficiente. Disponible: " + inventario.getCantidad());
        }
    }

    private CarritoDTO convertirDTO(Carrito carrito, List<String> advertencias) {
        List<ElementoCarritoDTO> elementos = elementoRepository
                .findByCarritoIdOrderById(carrito.getId())
                .stream()
                .map(this::convertirElementoDTO)
                .toList();

        return CarritoDTO.builder()
                .id(carrito.getId())
                .elementos(elementos)
                .cantidadTotal(elementos.stream().mapToInt(ElementoCarritoDTO::getCantidad).sum())
                .total(carrito.getTotal())
                .advertencias(advertencias)
                .build();
    }

    private ElementoCarritoDTO convertirElementoDTO(ElementoCarrito elemento) {
        Variante variante = elemento.getVariante();

        return ElementoCarritoDTO.builder()
                .id(elemento.getId())
                .productoId(elemento.getProducto().getId())
                .nombreProducto(elemento.getProducto().getNombre())
                .varianteId(variante != null ? variante.getId() : null)
                .nombreVariante(variante != null ? variante.getNombre() : null)
                .cantidad(elemento.getCantidad())
                .precioUnitario(elemento.getPrecioUnitario())
                .subtotal(elemento.getPrecioUnitario()
                        .multiply(BigDecimal.valueOf(elemento.getCantidad())))
                .build();
    }

    private CarritoDTO carritoVacio() {
        return CarritoDTO.builder()
                .id(null)
                .elementos(List.of())
                .cantidadTotal(0)
                .total(BigDecimal.ZERO)
                .advertencias(List.of())
                .build();
    }
}
