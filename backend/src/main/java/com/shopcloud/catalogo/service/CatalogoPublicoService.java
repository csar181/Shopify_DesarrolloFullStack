package com.shopcloud.catalogo.service;

import com.shopcloud.catalogo.dto.publico.CategoriaPublicaDTO;
import com.shopcloud.catalogo.dto.publico.ProductoPublicoDTO;
import com.shopcloud.catalogo.dto.publico.TiendaPublicaDTO;
import com.shopcloud.catalogo.dto.publico.VariantePublicaDTO;
import com.shopcloud.catalogo.entity.ImagenProducto;
import com.shopcloud.catalogo.entity.Producto;
import com.shopcloud.catalogo.entity.Variante;
import com.shopcloud.catalogo.repository.CategoriaRepository;
import com.shopcloud.catalogo.repository.ImagenProductoRepository;
import com.shopcloud.catalogo.repository.ProductoRepository;
import com.shopcloud.catalogo.repository.VarianteRepository;
import com.shopcloud.exception.AccesoTiendaException;
import com.shopcloud.exception.CodigoError;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.inventario.entity.Inventario;
import com.shopcloud.inventario.repository.InventarioRepository;
import com.shopcloud.plan.service.AccesoTiendaService;
import com.shopcloud.tienda.entity.Tienda;
import com.shopcloud.tienda.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Storefront: la tienda se identifica por su slug y debe estar publicada. */
@Service
@RequiredArgsConstructor
public class CatalogoPublicoService {

    private final TiendaRepository tiendaRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final ImagenProductoRepository imagenRepository;
    private final VarianteRepository varianteRepository;
    private final InventarioRepository inventarioRepository;
    private final AccesoTiendaService accesoTiendaService;

    @Transactional(readOnly = true)
    public TiendaPublicaDTO obtenerTienda(String slug) {
        Tienda tienda = buscarTiendaPublicada(slug);

        return TiendaPublicaDTO.builder()
                .id(tienda.getId())
                .nombre(tienda.getNombre())
                .slug(tienda.getSlug())
                .descripcion(tienda.getDescripcion())
                .urlLogo(tienda.getUrlLogo())
                .urlBanner(tienda.getUrlBanner())
                .colorPrimario(tienda.getColorPrimario())
                .correoContacto(tienda.getCorreoContacto())
                .telefonoContacto(tienda.getTelefonoContacto())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CategoriaPublicaDTO> listarCategorias(String slug) {
        return categoriaRepository
                .findByTiendaIdAndActivoTrue(buscarTiendaPublicada(slug).getId())
                .stream()
                .map(categoria -> CategoriaPublicaDTO.builder()
                        .id(categoria.getId())
                        .nombre(categoria.getNombre())
                        .descripcion(categoria.getDescripcion())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoPublicoDTO> listarProductos(String slug, Long categoriaId) {
        Long tiendaId = buscarTiendaPublicada(slug).getId();

        List<Producto> productos = categoriaId == null
                ? productoRepository.findByTiendaIdAndActivoTrue(tiendaId)
                : productoRepository.findByTiendaIdAndCategoriaIdAndActivoTrue(tiendaId, categoriaId);

        return productos.stream().map(this::convertirProducto).toList();
    }

    @Transactional(readOnly = true)
    public ProductoPublicoDTO obtenerProducto(String slug, Long productoId) {
        Long tiendaId = buscarTiendaPublicada(slug).getId();

        return productoRepository.findByIdAndTiendaIdAndActivoTrue(productoId, tiendaId)
                .map(this::convertirProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado"));
    }

    private Tienda buscarTiendaPublicada(String slug) {
        return tiendaRepository.findBySlug(slug)
                .filter(accesoTiendaService::estaPublicada)
                .orElseThrow(() -> new AccesoTiendaException(
                        HttpStatus.NOT_FOUND,
                        CodigoError.TIENDA_NO_DISPONIBLE,
                        "La tienda no está disponible"
                ));
    }

    private ProductoPublicoDTO convertirProducto(Producto producto) {
        List<ImagenProducto> imagenes = imagenRepository.findByProductoId(producto.getId());
        List<Inventario> inventario = inventarioRepository.findByProductoId(producto.getId());

        List<VariantePublicaDTO> variantes = varianteRepository
                .findByProductoIdAndActivoTrue(producto.getId())
                .stream()
                .map(variante -> convertirVariante(variante, inventario))
                .toList();

        return ProductoPublicoDTO.builder()
                .id(producto.getId())
                .categoriaId(producto.getCategoria() != null ? producto.getCategoria().getId() : null)
                .categoriaNombre(producto.getCategoria() != null ? producto.getCategoria().getNombre() : null)
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .destacado(producto.getDestacado())
                .urlImagenPrincipal(imagenes.stream()
                        .filter(imagen -> Boolean.TRUE.equals(imagen.getEsPrincipal()))
                        .map(ImagenProducto::getUrlImagen)
                        .findFirst()
                        .orElse(null))
                .imagenes(imagenes.stream().map(ImagenProducto::getUrlImagen).toList())
                .variantes(variantes)
                .stock(inventario.stream().mapToInt(Inventario::getCantidad).sum())
                .build();
    }

    private VariantePublicaDTO convertirVariante(Variante variante, List<Inventario> inventario) {
        return VariantePublicaDTO.builder()
                .id(variante.getId())
                .nombre(variante.getNombre())
                .precio(variante.precioEfectivo())
                .stock(inventario.stream()
                        .filter(item -> item.getVariante() != null
                                && item.getVariante().getId().equals(variante.getId()))
                        .mapToInt(Inventario::getCantidad)
                        .sum())
                .build();
    }
}
