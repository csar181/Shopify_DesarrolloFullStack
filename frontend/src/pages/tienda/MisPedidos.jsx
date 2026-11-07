import { useCallback } from 'react'
import { Link } from 'react-router'
import { listarMisPedidos } from '../../api/clienteTienda'
import CuentaCliente from '../../components/tienda-publica/CuentaCliente'
import Alerta from '../../components/ui/Alerta'
import Insignia from '../../components/ui/Insignia'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearFechaHora, formatearSoles } from '../../utils/formato'
import { estadoPedido } from '../../utils/pedido'

const DESCRIPCION = {
  CONFIRMADO: 'Recibimos tu pedido y tu pago.',
  PREPARANDO: 'Estamos preparando tu pedido.',
  ENVIADO: 'Tu pedido va en camino.',
  ENTREGADO: 'Tu pedido fue entregado.',
  CANCELADO: 'Pedido cancelado. El pago fue anulado.',
}

function Lista() {
  const { slug, cliente } = useTiendaPublica()
  const clienteId = cliente?.id
  const cargar = useCallback(() => (clienteId ? listarMisPedidos(slug) : Promise.resolve([])), [slug, clienteId])
  const { datos, cargando, error } = useDatos(cargar)
  const pedidos = [...(datos ?? [])].sort((a, b) => b.id - a.id)

  if (cargando) return <p className="text-slate-500">Cargando tus pedidos…</p>
  if (error) return <Alerta>{error}</Alerta>
  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
        <p className="text-slate-600">Todavía no hiciste compras en esta tienda.</p>
        <Link to={`/tienda/${slug}`} className="mt-3 inline-block font-semibold underline">
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {pedidos.map((p) => {
        const estado = estadoPedido(p.estado)
        return (
          <li key={p.id}>
            <Link
              to={`/tienda/${slug}/pedido/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  Pedido #{p.id} <span className="font-normal text-slate-500">· {formatearFechaHora(p.creadoEn)}</span>
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{DESCRIPCION[p.estado] ?? estado.texto}</p>
                {p.numeroComprobante && <p className="text-xs text-slate-500">{p.numeroComprobante}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900 tabular-nums">{formatearSoles(p.total)}</span>
                <Insignia tono={estado.tono}>{estado.texto}</Insignia>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function MisPedidos() {
  return (
    <CuentaCliente titulo="Mi cuenta" volver="cuenta/pedidos">
      <Lista />
    </CuentaCliente>
  )
}
