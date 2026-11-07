/** Estados de un pedido: CONFIRMADO → PREPARANDO → ENVIADO → ENTREGADO, o CANCELADO. */
export const ESTADOS_PEDIDO = {
  PENDIENTE: { texto: 'Pendiente', tono: 'gris' },
  CONFIRMADO: { texto: 'Confirmado', tono: 'azul' },
  PREPARANDO: { texto: 'En preparación', tono: 'ambar' },
  ENVIADO: { texto: 'Enviado', tono: 'azul' },
  ENTREGADO: { texto: 'Entregado', tono: 'verde' },
  CANCELADO: { texto: 'Cancelado', tono: 'rojo' },
}

export function estadoPedido(estado) {
  return ESTADOS_PEDIDO[estado] ?? { texto: estado, tono: 'gris' }
}

/**
 * Cambios de estado que permite el backend (PedidoService.TRANSICIONES), con el texto del botón.
 * Cancelar anula el pago y el comprobante y devuelve el stock.
 */
export const SIGUIENTES_ESTADOS = {
  PENDIENTE: [{ estado: 'CONFIRMADO', accion: 'Confirmar pedido' }],
  CONFIRMADO: [{ estado: 'PREPARANDO', accion: 'Empezar a preparar' }],
  PREPARANDO: [{ estado: 'ENVIADO', accion: 'Marcar como enviado' }],
  ENVIADO: [{ estado: 'ENTREGADO', accion: 'Marcar como entregado' }],
}
export const SE_PUEDE_CANCELAR = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO']

/** Recorrido normal, para mostrar en qué paso va el pedido. */
export const RECORRIDO_PEDIDO = ['CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO']

/** "Av. Larco 123, Miraflores, Lima" a partir de los campos de una dirección o de un pedido. */
export function textoDireccion(d) {
  return [d.lineaDireccion, d.distrito, d.ciudad, d.departamento].filter(Boolean).join(', ')
}
