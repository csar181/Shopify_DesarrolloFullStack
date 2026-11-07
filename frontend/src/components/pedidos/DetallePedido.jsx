import { formatearSoles } from '../../utils/formato'
import { textoDireccion } from '../../utils/pedido'

/** Productos del pedido e importes (subtotal, descuento, base imponible, IGV y total). */
export function ProductosPedido({ pedido }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-200">
        {pedido.elementos.map((e) => (
          <li key={e.id} className="flex justify-between gap-3 px-5 py-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium text-slate-900">{e.nombreProducto}</span>
              {e.nombreVariante && <span className="text-slate-500"> · {e.nombreVariante}</span>}
              <span className="block text-slate-500">
                {e.cantidad} × {formatearSoles(e.precioUnitario)}
                {e.sku && ` · SKU ${e.sku}`}
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
  )
}

function Bloque({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </section>
  )
}

/** Envío, pago y comprobante. `extra` agrega bloques (por ejemplo, el cliente en el panel). */
export function DatosPedido({ pedido, extra }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {extra}
      <Bloque titulo="Envío a">
        <p>{textoDireccion(pedido)}</p>
        {pedido.codigoPostal && <p className="text-slate-500">CP {pedido.codigoPostal}</p>}
        {pedido.referencia && <p className="text-slate-500">Ref.: {pedido.referencia}</p>}
      </Bloque>
      {pedido.transaccion && (
        <Bloque titulo="Pago">
          <p>
            {pedido.transaccion.metodoPagoNombre} · {formatearSoles(pedido.transaccion.monto)}
          </p>
          <p className={pedido.transaccion.estado === 'ANULADA' ? 'text-red-700' : 'text-slate-500'}>
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
  )
}
