import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { listarDireccionesCliente, listarPedidosTienda, obtenerCliente } from '../../../api/gestion'
import TablaPedidos from '../../../components/pedidos/TablaPedidos'
import Alerta from '../../../components/ui/Alerta'
import { useDatos } from '../../../hooks/useDatos'
import { formatearSoles } from '../../../utils/formato'
import { textoDireccion } from '../../../utils/pedido'

export default function DetalleCliente() {
  const { id } = useParams()
  // El backend no filtra pedidos por cliente: se piden los de la tienda y se filtran aquí.
  const cargar = useCallback(
    () => Promise.all([obtenerCliente(id), listarDireccionesCliente(id), listarPedidosTienda()]),
    [id],
  )
  const { datos, cargando, error } = useDatos(cargar)
  const [cliente, direcciones, todos] = datos ?? [null, [], []]
  const pedidos = todos.filter((p) => String(p.clienteId) === id).sort((a, b) => b.id - a.id)
  const comprado = pedidos.filter((p) => p.estado !== 'CANCELADO').reduce((suma, p) => suma + Number(p.total), 0)

  return (
    <div className="max-w-4xl">
      <Link to="/panel/clientes" className="text-sm font-medium text-marca-700 hover:underline">
        ← Clientes
      </Link>

      {cargando ? (
        <p className="mt-4 text-slate-500">Cargando cliente…</p>
      ) : !cliente ? (
        <div className="mt-4">
          <Alerta>{error || 'No se encontró el cliente.'}</Alerta>
        </div>
      ) : (
        <>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{cliente.nombre}</h1>
          <p className="text-sm text-slate-600">
            <a href={`mailto:${cliente.correoElectronico}`} className="hover:underline">
              {cliente.correoElectronico}
            </a>
            {cliente.telefono && <> · {cliente.telefono}</>}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <dt className="text-sm text-slate-500">Pedidos</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{pedidos.length}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <dt className="text-sm text-slate-500">Total comprado (sin cancelados)</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{formatearSoles(comprado)}</dd>
            </div>
          </dl>

          <section className="mt-6">
            <h2 className="font-semibold text-slate-900">Direcciones</h2>
            {direcciones.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No tiene direcciones guardadas.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {direcciones.map((d) => (
                  <li key={d.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {textoDireccion(d)}
                    {d.referencia && <span className="block text-slate-500">Ref.: {d.referencia}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6">
            <h2 className="font-semibold text-slate-900">Pedidos</h2>
            <div className="mt-2">
              {pedidos.length === 0 ? (
                <p className="text-sm text-slate-500">Todavía no compró.</p>
              ) : (
                <TablaPedidos pedidos={pedidos} sinCliente />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
