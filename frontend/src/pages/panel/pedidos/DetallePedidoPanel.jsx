import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { cambiarEstadoPedido, obtenerPedidoTienda } from '../../../api/gestion'
import { DatosPedido, ProductosPedido } from '../../../components/pedidos/DetallePedido'
import Alerta from '../../../components/ui/Alerta'
import Boton from '../../../components/ui/Boton'
import BotonConfirmar from '../../../components/ui/BotonConfirmar'
import Insignia from '../../../components/ui/Insignia'
import { useDatos } from '../../../hooks/useDatos'
import { formatearFechaHora } from '../../../utils/formato'
import { estadoPedido, ESTADOS_PEDIDO, RECORRIDO_PEDIDO, SE_PUEDE_CANCELAR, SIGUIENTES_ESTADOS } from '../../../utils/pedido'

/** Pasos del recorrido normal, marcando hasta dónde llegó el pedido. */
function Recorrido({ estado }) {
  const actual = RECORRIDO_PEDIDO.indexOf(estado)
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label="Avance del pedido">
      {RECORRIDO_PEDIDO.map((paso, i) => {
        const hecho = i <= actual
        return (
          <li key={paso} className="flex items-center gap-2">
            {i > 0 && <span className={`h-px w-6 ${hecho ? 'bg-marca-600' : 'bg-slate-300'}`} aria-hidden="true" />}
            <span
              className={`flex items-center gap-1.5 ${hecho ? 'font-medium text-marca-700' : 'text-slate-400'}`}
              aria-current={i === actual ? 'step' : undefined}
            >
              <span className={`size-2.5 rounded-full ${hecho ? 'bg-marca-600' : 'bg-slate-300'}`} aria-hidden="true" />
              {ESTADOS_PEDIDO[paso].texto}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Acciones({ pedido, onCambio }) {
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)
  const siguientes = SIGUIENTES_ESTADOS[pedido.estado] ?? []
  const cancelable = SE_PUEDE_CANCELAR.includes(pedido.estado)

  async function cambiar(estado) {
    setError('')
    setProcesando(true)
    try {
      onCambio(await cambiarEstadoPedido(pedido.id, estado))
    } catch (e) {
      setError(e.message)
    } finally {
      setProcesando(false)
    }
  }

  if (siguientes.length === 0 && !cancelable) {
    return (
      <p className="text-sm text-slate-600">
        {pedido.estado === 'CANCELADO'
          ? 'Pedido cancelado: el pago y el comprobante se anularon y el stock se devolvió.'
          : 'Pedido entregado. No hay más acciones.'}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <Alerta>{error}</Alerta>
      <div className="flex flex-wrap items-center gap-3">
        {siguientes.map((s) => (
          <Boton key={s.estado} cargando={procesando} onClick={() => cambiar(s.estado)}>
            {s.accion}
          </Boton>
        ))}
        {cancelable && (
          <BotonConfirmar
            disabled={procesando}
            pregunta="Se anulan el pago y el comprobante y se devuelve el stock. ¿Cancelar?"
            textoConfirmar="Sí, cancelar pedido"
            onConfirmar={() => cambiar('CANCELADO')}
          >
            Cancelar pedido
          </BotonConfirmar>
        )}
      </div>
    </div>
  )
}

export default function DetallePedidoPanel() {
  const { id } = useParams()
  const cargar = useCallback(() => obtenerPedidoTienda(id), [id])
  const { datos: pedido, cargando, error, setDatos } = useDatos(cargar)

  return (
    <div className="max-w-4xl">
      <Link to="/panel/pedidos" className="text-sm font-medium text-marca-700 hover:underline">
        ← Pedidos
      </Link>

      {cargando ? (
        <p className="mt-4 text-slate-500">Cargando pedido…</p>
      ) : !pedido ? (
        <div className="mt-4">
          <Alerta>{error || 'No se encontró el pedido.'}</Alerta>
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Pedido #{pedido.id}</h1>
              <p className="text-sm text-slate-500">
                {formatearFechaHora(pedido.creadoEn)}
                {pedido.actualizadoEn && pedido.actualizadoEn !== pedido.creadoEn && (
                  <> · actualizado {formatearFechaHora(pedido.actualizadoEn)}</>
                )}
              </p>
            </div>
            <Insignia tono={estadoPedido(pedido.estado).tono}>{estadoPedido(pedido.estado).texto}</Insignia>
          </div>

          <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            {pedido.estado !== 'CANCELADO' && <Recorrido estado={pedido.estado} />}
            <Acciones pedido={pedido} onCambio={setDatos} />
          </section>

          <div className="mt-6 space-y-4">
            <ProductosPedido pedido={pedido} />
            <DatosPedido
              pedido={pedido}
              extra={
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2">
                  <h2 className="text-sm font-semibold text-slate-900">Cliente</h2>
                  <Link
                    to={`/panel/clientes/${pedido.clienteId}`}
                    className="mt-2 inline-block text-sm font-medium text-marca-700 hover:underline"
                  >
                    {pedido.clienteNombre} →
                  </Link>
                </section>
              }
            />
          </div>
        </>
      )}
    </div>
  )
}
