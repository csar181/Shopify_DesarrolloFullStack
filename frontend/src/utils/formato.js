const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const fecha = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' })
const fechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' })

/** 29 → "S/ 29.00". El backend envía los montos como número (BigDecimal). */
export function formatearSoles(monto) {
  return soles.format(Number(monto ?? 0))
}

// El backend envía las fechas sin zona horaria ("2026-11-14T08:15:00"), en hora de Lima.
// new Date() las interpreta en la hora local del navegador, que en Perú es la misma.

/** "2026-11-14T08:15:00" → "14 nov 2026" */
export function formatearFecha(valor) {
  return valor ? fecha.format(new Date(valor)) : ''
}

/** "2026-11-14T08:15:00" → "14 nov 2026, 8:15 a. m." */
export function formatearFechaHora(valor) {
  return valor ? fechaHora.format(new Date(valor)) : ''
}

/** Días completos que faltan hasta la fecha (0 si ya pasó). */
export function diasRestantes(valor) {
  if (!valor) return 0
  const milisegundos = new Date(valor).getTime() - Date.now()
  return Math.max(0, Math.ceil(milisegundos / 86_400_000))
}
