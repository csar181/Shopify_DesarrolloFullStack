import { apiPropietario } from './cliente'

// Métodos de pago de la tienda actual (X-Tenant-ID). Sin al menos uno activo no se puede comprar.
// Método: { id, nombre, tipo, instrucciones, datosPago, activo, creadoEn }

/** Tipos que ofrece el panel. El backend acepta cualquier texto de hasta 30 caracteres. */
export const TIPOS_METODO_PAGO = {
  TARJETA: 'Tarjeta de crédito o débito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFERENCIA: 'Transferencia bancaria',
  CONTRA_ENTREGA: 'Pago contra entrega',
}

/** GET /api/gestion/metodos-pago: activos e inactivos, ordenados por nombre. */
export async function listarMetodosPago() {
  const { data } = await apiPropietario.get('/gestion/metodos-pago')
  return data
}

/** POST { nombre, tipo, instrucciones, datosPago }. El nombre no se repite en la tienda. */
export async function crearMetodoPago(datos) {
  const { data } = await apiPropietario.post('/gestion/metodos-pago', datos)
  return data
}

export async function actualizarMetodoPago(id, datos) {
  const { data } = await apiPropietario.put(`/gestion/metodos-pago/${id}`, datos)
  return data
}

/** DELETE: lo desactiva; deja de ofrecerse al pagar. */
export async function desactivarMetodoPago(id) {
  await apiPropietario.delete(`/gestion/metodos-pago/${id}`)
}

export async function activarMetodoPago(id) {
  const { data } = await apiPropietario.patch(`/gestion/metodos-pago/${id}/activar`)
  return data
}
