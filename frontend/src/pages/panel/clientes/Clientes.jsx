import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { listarClientes, listarPedidosTienda } from '../../../api/gestion'
import Alerta from '../../../components/ui/Alerta'
import { useDatos } from '../../../hooks/useDatos'
import { formatearSoles } from '../../../utils/formato'
import { quitarTildes } from '../../../utils/texto'

/** Pedidos y monto comprado por cliente. Los cancelados no cuentan como compra. */
function resumenPorCliente(pedidos) {
  const resumen = new Map()
  for (const p of pedidos) {
    if (p.estado === 'CANCELADO') continue
    const actual = resumen.get(p.clienteId) ?? { pedidos: 0, total: 0 }
    resumen.set(p.clienteId, { pedidos: actual.pedidos + 1, total: actual.total + Number(p.total) })
  }
  return resumen
}

export default function Clientes() {
  const cargar = useCallback(() => Promise.all([listarClientes(), listarPedidosTienda()]), [])
  const { datos, cargando, error } = useDatos(cargar)
  const [clientes, pedidos] = datos ?? [[], []]
  const [busqueda, setBusqueda] = useState('')

  const compras = resumenPorCliente(pedidos)
  const termino = quitarTildes(busqueda.trim())
  const visibles = clientes
    .filter((c) => !termino || quitarTildes(`${c.nombre} ${c.correoElectronico}`).includes(termino))
    .sort((a, b) => (compras.get(b.id)?.total ?? 0) - (compras.get(a.id)?.total ?? 0) || a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
      <p className="mt-1 text-sm text-slate-600">
        Las personas que crearon una cuenta en tu tienda. Primero, las que más compraron.
      </p>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o correo"
        aria-label="Buscar clientes"
        className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
      />

      <div className="mt-4">
        <Alerta>{error}</Alerta>
        {cargando ? (
          <p className="text-slate-500">Cargando clientes…</p>
        ) : visibles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            {termino ? 'Ningún cliente coincide.' : 'Todavía nadie creó una cuenta en tu tienda.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-right">Comprado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visibles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/panel/clientes/${c.id}`} className="font-medium text-slate-900 hover:text-marca-700 hover:underline">
                        {c.nombre}
                      </Link>
                      <span className="block text-xs text-slate-500">{c.correoElectronico}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.telefono ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{compras.get(c.id)?.pedidos ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatearSoles(compras.get(c.id)?.total ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
