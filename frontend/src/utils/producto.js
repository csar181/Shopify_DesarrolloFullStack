import { formatearSoles } from './formato'

/** Precio a mostrar: con variantes de distinto precio, "Desde S/ X". */
export function textoPrecio(producto) {
  const precios = producto.variantes.length > 0 ? producto.variantes.map((v) => Number(v.precio)) : [Number(producto.precio)]
  const minimo = Math.min(...precios)
  return precios.some((p) => p !== minimo) ? `Desde ${formatearSoles(minimo)}` : formatearSoles(minimo)
}

/** Destacados primero, después por nombre. */
export function ordenarParaVitrina(productos) {
  return [...productos].sort(
    (a, b) => Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre, 'es'),
  )
}
