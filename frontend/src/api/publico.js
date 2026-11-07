import { apiPublica } from './cliente'

// Tienda pública (storefront). Sin sesión: la tienda se identifica por su slug.
// Si la tienda no existe o no tiene un plan pagado vigente, responde 404 TIENDA_NO_DISPONIBLE.
//
// Tienda:   { id, nombre, slug, descripcion, urlLogo, urlBanner, colorPrimario, correoContacto, telefonoContacto }
// Producto: { id, categoriaId, categoriaNombre, nombre, descripcion, precio, destacado,
//             urlImagenPrincipal, imagenes: [url], stock, variantes: [{ id, nombre, precio, stock }] }
//   - El precio de cada variante ya viene resuelto (el suyo o el del producto).
//   - Con variantes, hay que elegir una para comprar: el stock se lleva por variante.
//   - Los precios incluyen IGV.

export async function obtenerTiendaPublica(slug) {
  const { data } = await apiPublica.get(`/publico/tiendas/${encodeURIComponent(slug)}`)
  return data
}

export async function listarCategoriasPublicas(slug) {
  const { data } = await apiPublica.get(`/publico/tiendas/${encodeURIComponent(slug)}/categorias`)
  return data
}

/** Solo productos activos. */
export async function listarProductosPublicos(slug) {
  const { data } = await apiPublica.get(`/publico/tiendas/${encodeURIComponent(slug)}/productos`)
  return data
}

export async function obtenerProductoPublico(slug, id) {
  const { data } = await apiPublica.get(`/publico/tiendas/${encodeURIComponent(slug)}/productos/${id}`)
  return data
}
