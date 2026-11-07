/** Estados de un pedido: CONFIRMADO → PREPARANDO → ENVIADO → ENTREGADO, o CANCELADO. */
export const ESTADOS_PEDIDO = {
  CONFIRMADO: { texto: 'Confirmado', tono: 'azul' },
  PREPARANDO: { texto: 'En preparación', tono: 'ambar' },
  ENVIADO: { texto: 'Enviado', tono: 'azul' },
  ENTREGADO: { texto: 'Entregado', tono: 'verde' },
  CANCELADO: { texto: 'Cancelado', tono: 'rojo' },
}

export function estadoPedido(estado) {
  return ESTADOS_PEDIDO[estado] ?? { texto: estado, tono: 'gris' }
}

/** "Av. Larco 123, Miraflores, Lima" a partir de los campos de una dirección o de un pedido. */
export function textoDireccion(d) {
  return [d.lineaDireccion, d.distrito, d.ciudad, d.departamento].filter(Boolean).join(', ')
}
