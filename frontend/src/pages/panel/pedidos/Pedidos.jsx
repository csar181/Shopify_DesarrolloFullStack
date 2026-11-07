import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { listarPedidosTienda } from '../../../api/gestion'
import TablaPedidos from '../../../components/pedidos/TablaPedidos'
import Alerta from '../../../components/ui/Alerta'
import Pestanas from '../../../components/ui/Pestanas'
import { useDatos } from '../../../hooks/useDatos'
import { ESTADOS_PEDIDO } from '../../../utils/pedido'
import { quitarTildes } from '../../../utils/texto'

// PENDIENTE existe en el backend, pero el checkout crea los pedidos ya confirmados.
const PESTANAS = ['CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

export default function Pedidos() {
  // ?estado=CONFIRMADO abre esa pestaña (lo usa el aviso del inicio del panel).
  const [parametros, setParametros] = useSearchParams()
  const estado = PESTANAS.includes(parametros.get('estado')) ? parametros.get('estado') : ''
  const [busqueda, setBusqueda] = useState('')

  // Se piden todos una vez y se filtran aquí: así cada pestaña muestra su cantidad.
  const cargar = useCallback(() => listarPedidosTienda(), [])
  const { datos, cargando, error } = useDatos(cargar)
  const pedidos = datos ?? []

  const termino = quitarTildes(busqueda.trim().replace(/^#/, ''))
  const visibles = pedidos
    .filter((p) => !estado || p.estado === estado)
    .filter(
      (p) =>
        !termino ||
        String(p.id) === termino ||
        quitarTildes(p.clienteNombre).includes(termino) ||
        quitarTildes(p.numeroComprobante).includes(termino),
    )
    .sort((a, b) => b.id - a.id)

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
      <p className="mt-1 text-sm text-slate-600">
        Recorrido normal: confirmado, en preparación, enviado y entregado. Se puede cancelar hasta antes de enviarlo.
      </p>

      <div className="mt-6 overflow-x-auto">
        <Pestanas
          valor={estado}
          onChange={(valor) => setParametros(valor ? { estado: valor } : {}, { replace: true })}
          opciones={[
            { valor: '', texto: 'Todos', cantidad: pedidos.length },
            ...PESTANAS.map((e) => ({
              valor: e,
              texto: ESTADOS_PEDIDO[e].texto,
              cantidad: pedidos.filter((p) => p.estado === e).length,
            })),
          ]}
        />
      </div>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por número, cliente o comprobante"
        aria-label="Buscar pedidos"
        className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
      />

      <div className="mt-4">
        <Alerta>{error}</Alerta>
        {cargando ? (
          <p className="text-slate-500">Cargando pedidos…</p>
        ) : visibles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            {termino || estado ? 'No hay pedidos que coincidan.' : 'Todavía no tienes pedidos.'}
          </p>
        ) : (
          <TablaPedidos pedidos={visibles} />
        )}
      </div>
    </div>
  )
}
