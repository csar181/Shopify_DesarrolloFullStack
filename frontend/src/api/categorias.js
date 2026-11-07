import { apiPropietario } from './cliente'

// Categorías de la tienda actual (X-Tenant-ID).
// Cada una llega como { id, nombre, descripcion, activo, creadoEn }.

/** GET /api/categorias. Con incluirInactivos también trae las desactivadas. */
export async function listarCategorias({ incluirInactivos = false } = {}) {
  const { data } = await apiPropietario.get('/categorias', { params: { incluirInactivos } })
  return data
}

/** POST /api/categorias { nombre, descripcion }. Respeta el límite del plan (LIMITE_PLAN). */
export async function crearCategoria(datos) {
  const { data } = await apiPropietario.post('/categorias', datos)
  return data
}

/** PUT /api/categorias/{id} { nombre, descripcion } */
export async function actualizarCategoria(id, datos) {
  const { data } = await apiPropietario.put(`/categorias/${id}`, datos)
  return data
}

/** DELETE /api/categorias/{id}: no borra, la desactiva y libera cupo del plan. */
export async function desactivarCategoria(id) {
  await apiPropietario.delete(`/categorias/${id}`)
}

/** PATCH /api/categorias/{id}/activar: vuelve a comprobar el límite del plan. */
export async function activarCategoria(id) {
  const { data } = await apiPropietario.patch(`/categorias/${id}/activar`)
  return data
}
