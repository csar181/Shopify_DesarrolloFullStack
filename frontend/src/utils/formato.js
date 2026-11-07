const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

/** 29 → "S/ 29.00". El backend envía los montos como número (BigDecimal). */
export function formatearSoles(monto) {
  return soles.format(Number(monto ?? 0))
}
