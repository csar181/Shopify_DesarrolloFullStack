package com.shopcloud.catalogo.controller;

import com.shopcloud.catalogo.dto.publico.CategoriaPublicaDTO;
import com.shopcloud.catalogo.dto.publico.ProductoPublicoDTO;
import com.shopcloud.catalogo.dto.publico.TiendaPublicaDTO;
import com.shopcloud.catalogo.service.CatalogoPublicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publico/tiendas/{slug}")
@RequiredArgsConstructor
public class CatalogoPublicoController {

    private final CatalogoPublicoService catalogoPublicoService;

    @GetMapping
    public TiendaPublicaDTO obtenerTienda(@PathVariable String slug) {
        return catalogoPublicoService.obtenerTienda(slug);
    }

    @GetMapping("/categorias")
    public List<CategoriaPublicaDTO> listarCategorias(@PathVariable String slug) {
        return catalogoPublicoService.listarCategorias(slug);
    }

    @GetMapping("/productos")
    public List<ProductoPublicoDTO> listarProductos(
            @PathVariable String slug,
            @RequestParam(required = false) Long categoriaId
    ) {
        return catalogoPublicoService.listarProductos(slug, categoriaId);
    }

    @GetMapping("/productos/{productoId}")
    public ProductoPublicoDTO obtenerProducto(
            @PathVariable String slug,
            @PathVariable Long productoId
    ) {
        return catalogoPublicoService.obtenerProducto(slug, productoId);
    }
}
