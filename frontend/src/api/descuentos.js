import { apiPropietario } from './cliente'

// Códigos de descuento de la tienda actual (X-Tenant-ID).
// Descuento: { id, codigo, tipo ('PORCENTAJE' | 'MONTO_FIJO'), valor, fechaInicio, fechaFin, activo, vigente }
//
// Reglas del backend: el código se guarda en mayúsculas y no se repite en la tienda; un porcentaje
// va de más de 0 a 100; la fecha de fin no puede ser anterior a la de inicio. Al comprar, el código
// solo aplica si está activo y dentro de sus fechas, y un monto fijo no puede superar el total.

/** GET /api/descuentos: todos, también los desactivados y vencidos. */
export async function listarDescuentos() {
  const { data } = await apiPropietario.get('/descuentos')
  return data
}

/** POST { codigo, tipo, valor, fechaInicio, fechaFin } */
export async function crearDescuento(datos) {
  const { data } = await apiPropietario.post('/descuentos', datos)
  return data
}

export async function actualizarDescuento(id, datos) {
  const { data } = await apiPropietario.put(`/descuentos/${id}`, datos)
  return data
}

/** DELETE: lo desactiva; el código deja de aplicarse. */
export async function desactivarDescuento(id) {
  await apiPropietario.delete(`/descuentos/${id}`)
}

export async function activarDescuento(id) {
  const { data } = await apiPropietario.patch(`/descuentos/${id}/activar`)
  return data
}
