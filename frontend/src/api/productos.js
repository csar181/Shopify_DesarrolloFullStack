import { apiPropietario } from './cliente'

// Productos de la tienda actual (X-Tenant-ID), con sus imágenes y variantes.
//
// Producto: { id, categoriaId, categoriaNombre, nombre, descripcion, sku, precio,
//             activo, destacado, creadoEn, actualizadoEn }
// Imagen:   { id, productoId, urlImagen, esPrincipal }
// Variante: { id, productoId, nombre, sku, precio (null = usa el del producto), activo }

/** GET /api/productos. Con incluirInactivos también trae los desactivados. */
export async function listarProductos({ incluirInactivos = false } = {}) {
  const { data } = await apiPropietario.get('/productos', { params: { incluirInactivos } })
  return data
}

/** GET /api/productos/{id}: también devuelve productos desactivados. */
export async function obtenerProducto(id) {
  const { data } = await apiPropietario.get(`/productos/${id}`)
  return data
}

/** POST /api/productos { categoriaId, nombre, descripcion, sku, precio, destacado } */
export async function crearProducto(datos) {
  const { data } = await apiPropietario.post('/productos', datos)
  return data
}

/** PUT /api/productos/{id}: mismos campos que al crear. */
export async function actualizarProducto(id, datos) {
  const { data } = await apiPropietario.put(`/productos/${id}`, datos)
  return data
}

/** DELETE /api/productos/{id}: no borra, lo desactiva y libera cupo del plan. */
export async function desactivarProducto(id) {
  await apiPropietario.delete(`/productos/${id}`)
}

/** PATCH /api/productos/{id}/activar: vuelve a comprobar el límite del plan. */
export async function activarProducto(id) {
  const { data } = await apiPropietario.patch(`/productos/${id}/activar`)
  return data
}

// ---- Imágenes (solo por URL: el backend no recibe archivos) ----

export async function listarImagenes(productoId) {
  const { data } = await apiPropietario.get(`/productos/${productoId}/imagenes`)
  return data
}

/** POST { urlImagen, esPrincipal }. Si es principal, la anterior deja de serlo. */
export async function agregarImagen(productoId, datos) {
  const { data } = await apiPropietario.post(`/productos/${productoId}/imagenes`, datos)
  return data
}

/** PUT { urlImagen, esPrincipal }: la URL es obligatoria también al solo cambiar la principal. */
export async function actualizarImagen(productoId, imagenId, datos) {
  const { data } = await apiPropietario.put(`/productos/${productoId}/imagenes/${imagenId}`, datos)
  return data
}

/** DELETE: esta sí se borra. */
export async function eliminarImagen(productoId, imagenId) {
  await apiPropietario.delete(`/productos/${productoId}/imagenes/${imagenId}`)
}

// ---- Variantes ----

/** Solo las activas: una variante eliminada no se puede recuperar. */
export async function listarVariantes(productoId) {
  const { data } = await apiPropietario.get(`/productos/${productoId}/variantes`)
  return data
}

/** POST { nombre, sku, precio }. Falla si el producto ya tiene stock general. */
export async function crearVariante(productoId, datos) {
  const { data } = await apiPropietario.post(`/productos/${productoId}/variantes`, datos)
  return data
}

export async function actualizarVariante(productoId, varianteId, datos) {
  const { data } = await apiPropietario.put(`/productos/${productoId}/variantes/${varianteId}`, datos)
  return data
}

/** DELETE: la desactiva; deja de aparecer en el listado. */
export async function eliminarVariante(productoId, varianteId) {
  await apiPropietario.delete(`/productos/${productoId}/variantes/${varianteId}`)
}
