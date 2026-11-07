import { Link } from 'react-router'
import { formatearSoles } from '../../utils/formato'

/**
 * Ranking de productos por unidades vendidas: barras horizontales de 12px, base recta a la
 * izquierda y punta redondeada, con el valor al final de cada barra (no hace falta tooltip:
 * todos los valores están a la vista).
 */
export default function MasVendidos({ productos }) {
  const maximo = Math.max(...productos.map((p) => Number(p.cantidadVendida)), 1)

  return (
    <ol className="space-y-3">
      {productos.map((p, i) => (
        <li key={p.productoId} className="grid grid-cols-[1.5rem_minmax(0,9rem)_1fr] items-center gap-3 sm:grid-cols-[1.5rem_minmax(0,14rem)_1fr]">
          <span className="text-right text-sm text-slate-400 tabular-nums">{i + 1}</span>
          <Link
            to={`/panel/productos/${p.productoId}`}
            className="truncate text-sm font-medium text-slate-800 hover:text-marca-700 hover:underline"
            title={p.nombreProducto}
          >
            {p.nombreProducto}
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="h-3 shrink-0 rounded-r bg-marca-600"
              style={{ width: `calc((100% - 8.5rem) * ${Number(p.cantidadVendida) / maximo})`, minWidth: '2px' }}
              aria-hidden="true"
            />
            <span className="text-sm whitespace-nowrap text-slate-700">
              <span className="font-semibold tabular-nums">{Number(p.cantidadVendida)}</span>
              <span className="text-slate-500"> · {formatearSoles(p.montoGenerado)}</span>
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
