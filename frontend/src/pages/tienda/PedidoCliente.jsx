import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { obtenerPedido } from '../../api/clienteTienda'
import Alerta from '../../components/ui/Alerta'
import Insignia from '../../components/ui/Insignia'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearFechaHora, formatearSoles } from '../../utils/formato'
import { estadoPedido, textoDireccion } from '../../utils/pedido'

function Bloque({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </section>
  )
}

/** Detalle de un pedido del cliente. Justo después de comprar, sirve de confirmación. */
export default function PedidoCliente() {
  const { id } = useParams()
  const { slug, cliente } = useTiendaPublica()
  const base = `/tienda/${slug}`
  const { pathname, state } = useLocation()
  const navegar = useNavigate()

  // El "¡Gracias por tu compra!" se muestra una vez: se borra del historial para que no vuelva al recargar.
  const [recienComprado] = useState(() => Boolean(state?.recienComprado))
  useEffect(() => {
    if (state?.recienComprado) navegar(pathname, { replace: true, state: null })
  }, [state, pathname, navegar])

  const clienteId = cliente?.id
  const cargar = useCallback(() => (clienteId ? obtenerPedido(slug, id) : Promise.resolve(null)), [slug, id, clienteId])
  const { datos: pedido, cargando, error } = useDatos(cargar)

  if (!cliente) {
    return <Navigate to={`${base}/ingresar`} replace />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {cargando ? (
        <p className="text-slate-500">Cargando pedido…</p>
      ) : !pedido ? (
        <Alerta>{error || 'No se encontró el pedido.'}</Alerta>
      ) : (
        <>
          {recienComprado && (
            <div className="mb-6 rounded-2xl bg-(--tienda) p-6 text-(--tienda-texto)">
              <p className="text-xl font-semibold">¡Gracias por tu compra, {cliente.nombre.split(' ')[0]}!</p>
              <p className="mt-1 opacity-90">Tu pedido fue confirmado y el pago quedó registrado.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Pedido #{pedido.id}</h1>
              <p className="text-sm text-slate-500">{formatearFechaHora(pedido.creadoEn)}</p>
            </div>
            <Insignia tono={estadoPedido(pedido.estado).tono}>{estadoPedido(pedido.estado).texto}</Insignia>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200">
            <ul className="divide-y divide-slate-200">
              {pedido.elementos.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium text-slate-900">{e.nombreProducto}</span>
                    {e.nombreVariante && <span className="text-slate-500"> · {e.nombreVariante}</span>}
                    <span className="block text-slate-500">
                      {e.cantidad} × {formatearSoles(e.precioUnitario)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{formatearSoles(e.subtotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="tabular-nums">{formatearSoles(pedido.subtotal)}</dd>
              </div>
              {Number(pedido.montoDescuento) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Descuento {pedido.codigoDescuento && `(${pedido.codigoDescuento})`}</dt>
                  <dd className="tabular-nums">−{formatearSoles(pedido.montoDescuento)}</dd>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <dt>Base imponible</dt>
                <dd className="tabular-nums">{formatearSoles(pedido.baseImponible)}</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>IGV ({Number(pedido.porcentajeIgv)}%)</dt>
                <dd className="tabular-nums">{formatearSoles(pedido.montoIgv)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatearSoles(pedido.total)}</dd>
              </div>
            </dl>
          </section>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Bloque titulo="Envío a">
              <p>{textoDireccion(pedido)}</p>
              {pedido.referencia && <p className="text-slate-500">Ref.: {pedido.referencia}</p>}
            </Bloque>
            {pedido.transaccion && (
              <Bloque titulo="Pago">
                <p>
                  {pedido.transaccion.metodoPagoNombre} · {formatearSoles(pedido.transaccion.monto)}
                </p>
                <p className="text-slate-500">
                  {pedido.transaccion.estado === 'ANULADA' ? 'Anulado' : 'Realizado'} · Ref. {pedido.transaccion.referenciaTransaccion}
                </p>
              </Bloque>
            )}
            {pedido.comprobante && (
              <Bloque titulo={pedido.comprobante.tipo === 'FACTURA' ? 'Factura' : 'Boleta'}>
                <p className="font-medium">{pedido.comprobante.numero}</p>
                <p>
                  {pedido.comprobante.nombreRazonSocial} · {pedido.comprobante.tipoDocumento} {pedido.comprobante.numeroDocumento}
                </p>
                {pedido.comprobante.direccionFiscal && <p className="text-slate-500">{pedido.comprobante.direccionFiscal}</p>}
                {pedido.comprobante.estado === 'ANULADO' && <p className="mt-1 text-red-700">Anulado</p>}
                <p className="mt-1 text-xs text-slate-500">Comprobante simulado, sin validez tributaria.</p>
              </Bloque>
            )}
          </div>

          <Link
            to={base}
            className="mt-8 inline-block rounded-lg bg-(--tienda) px-6 py-2.5 font-medium text-(--tienda-texto) hover:brightness-95"
          >
            Seguir comprando
          </Link>
        </>
      )}
    </div>
  )
}
