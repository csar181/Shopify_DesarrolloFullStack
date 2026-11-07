import { apiPropietario } from './cliente'

// Pedidos y clientes de la tienda actual (X-Tenant-ID), vistos por el propietario.
// Los pedidos se pueden gestionar aunque la tienda esté en solo lectura.

/** GET /api/gestion/pedidos: [{ id, estado, total, tipoComprobante, numeroComprobante, clienteId, clienteNombre, creadoEn }] */
export async function listarPedidosTienda() {
  const { data } = await apiPropietario.get('/gestion/pedidos')
  return data
}

/** Pedido completo: productos, importes, dirección, comprobante y transacción. */
export async function obtenerPedidoTienda(id) {
  const { data } = await apiPropietario.get(`/gestion/pedidos/${id}`)
  return data
}

/** PATCH { estado }. Solo los cambios de SIGUIENTES_ESTADOS; CANCELADO anula pago y comprobante y devuelve el stock. */
export async function cambiarEstadoPedido(id, estado) {
  const { data } = await apiPropietario.patch(`/gestion/pedidos/${id}/estado`, { estado })
  return data
}

/** GET /api/clientes: [{ id, nombre, correoElectronico, telefono }] */
export async function listarClientes() {
  const { data } = await apiPropietario.get('/clientes')
  return data
}

export async function obtenerCliente(id) {
  const { data } = await apiPropietario.get(`/clientes/${id}`)
  return data
}

export async function listarDireccionesCliente(id) {
  const { data } = await apiPropietario.get(`/clientes/${id}/direcciones`)
  return data
}
