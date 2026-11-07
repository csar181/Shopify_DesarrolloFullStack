import { Link } from 'react-router'
import { formatearFechaHora, formatearSoles } from '../../utils/formato'
import { estadoPedido } from '../../utils/pedido'
import Insignia from '../ui/Insignia'

/** Lista de pedidos del panel. Con `sinCliente` se oculta la columna (en el detalle de un cliente). */
export default function TablaPedidos({ pedidos, sinCliente = false }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3">Pedido</th>
            {!sinCliente && <th className="px-4 py-3">Cliente</th>}
            <th className="px-4 py-3">Comprobante</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {pedidos.map((p) => {
            const estado = estadoPedido(p.estado)
            return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/panel/pedidos/${p.id}`} className="font-medium text-slate-900 hover:text-marca-700 hover:underline">
                    #{p.id}
                  </Link>
                  <span className="block text-xs text-slate-500">{formatearFechaHora(p.creadoEn)}</span>
                </td>
                {!sinCliente && (
                  <td className="px-4 py-3">
                    <Link to={`/panel/clientes/${p.clienteId}`} className="text-slate-700 hover:underline">
                      {p.clienteNombre}
                    </Link>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{p.numeroComprobante ?? '—'}</td>
                <td className="px-4 py-3 text-right text-slate-900 tabular-nums">{formatearSoles(p.total)}</td>
                <td className="px-4 py-3">
                  <Insignia tono={estado.tono}>{estado.texto}</Insignia>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
