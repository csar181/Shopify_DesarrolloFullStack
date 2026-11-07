import { apiPropietario } from './cliente'

// Inventario de la tienda actual (X-Tenant-ID).
//
// Registro: { id, productoId, productoNombre, varianteId, varianteNombre, cantidad,
//             cantidadMinima, stockBajo (cantidad <= cantidadMinima), actualizadoEn }
//
// Reglas del backend:
// - Un producto lleva stock general (varianteId null) o por variante, nunca ambos.
// - Un producto sin registro tiene stock 0: no se puede comprar.
// - Con stock general no se pueden crear variantes; para cambiar, el registro debe quedar en 0 y eliminarse.

/** GET /api/inventario: todos los registros de la tienda, también los de productos desactivados. */
export async function listarInventario() {
  const { data } = await apiPropietario.get('/inventario')
  return data
}

/** GET /api/inventario/stock-bajo: registros con cantidad <= cantidadMinima. */
export async function listarStockBajo() {
  const { data } = await apiPropietario.get('/inventario/stock-bajo')
  return data
}

/** POST /api/inventario { productoId, varianteId, cantidad, cantidadMinima } */
export async function crearInventario(datos) {
  const { data } = await apiPropietario.post('/inventario', datos)
  return data
}

/** PUT /api/inventario/{id} { cantidad, cantidadMinima } */
export async function actualizarInventario(id, datos) {
  const { data } = await apiPropietario.put(`/inventario/${id}`, datos)
  return data
}

/** DELETE /api/inventario/{id}: solo con cantidad 0. */
export async function eliminarInventario(id) {
  await apiPropietario.delete(`/inventario/${id}`)
}
