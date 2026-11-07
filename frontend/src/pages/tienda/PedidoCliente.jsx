import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { obtenerPedido } from '../../api/clienteTienda'
import { DatosPedido, ProductosPedido } from '../../components/pedidos/DetallePedido'
import Alerta from '../../components/ui/Alerta'
import Insignia from '../../components/ui/Insignia'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearFechaHora } from '../../utils/formato'
import { estadoPedido } from '../../utils/pedido'

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

          <div className="mt-6 space-y-4">
            <ProductosPedido pedido={pedido} />
            <DatosPedido pedido={pedido} />
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
