import { apiPropietario } from './cliente'

// Tiendas del propietario. Estas rutas no usan X-Tenant-ID: la tienda va en la URL.
//
// Cada tienda llega como:
// { id, nombre, slug, descripcion, urlLogo, urlBanner, colorPrimario, correoContacto,
//   telefonoContacto, activo, creadoEn, publicada, administrable,
//   suscripcionTipo ('PRUEBA' | 'PAGADA' | null), planNombre, suscripcionFin }

/** GET /api/tiendas/mis-tiendas */
export async function listarMisTiendas() {
  const { data } = await apiPropietario.get('/tiendas/mis-tiendas')
  return data
}

/** GET /api/tiendas/{id} */
export async function obtenerTienda(id) {
  const { data } = await apiPropietario.get(`/tiendas/${id}`)
  return data
}

/** POST /api/tiendas: crea la tienda e inicia la prueba de 7 días del plan elegido. */
export async function crearTienda(datos) {
  const { data } = await apiPropietario.post('/tiendas', datos)
  return data
}

/** PUT /api/tiendas/{id}: el slug no se puede cambiar. Exige que la tienda sea administrable. */
export async function actualizarTienda(id, datos) {
  const { data } = await apiPropietario.put(`/tiendas/${id}`, datos)
  return data
}

/** DELETE /api/tiendas/{id}: no borra nada, solo la desactiva. */
export async function desactivarTienda(id) {
  await apiPropietario.delete(`/tiendas/${id}`)
}

/** PATCH /api/tiendas/{id}/activar */
export async function activarTienda(id) {
  const { data } = await apiPropietario.patch(`/tiendas/${id}/activar`)
  return data
}
