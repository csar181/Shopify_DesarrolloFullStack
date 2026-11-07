import { Link } from 'react-router'
import AvisosInventario from '../../components/inventario/AvisosInventario'
import AvisoPedidos from '../../components/pedidos/AvisoPedidos'
import DireccionTienda from '../../components/tienda/DireccionTienda'
import EstadoTienda from '../../components/tienda/EstadoTienda'
import LogoTienda from '../../components/tienda/LogoTienda'
import { useAuth } from '../../context/AuthContext'
import { useTiendas } from '../../context/TiendaContext'
import { formatearFecha } from '../../utils/formato'

function SinTiendas({ nombre }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Hola, {nombre}</h1>
      <p className="mt-2 text-slate-600">
        Todavía no tienes tiendas. Crea la primera, elige un plan y pruébala gratis durante 7 días.
      </p>
      <Link
        to="/panel/tiendas/nueva"
        className="mt-6 inline-block rounded-lg bg-marca-600 px-5 py-2.5 font-medium text-white hover:bg-marca-700"
      >
        Crear mi primera tienda
      </Link>
    </div>
  )
}

function Dato({ titulo, children }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{titulo}</dt>
      <dd className="mt-1 font-medium break-words text-slate-900">{children}</dd>
    </div>
  )
}

export default function InicioPanel() {
  const { usuario } = useAuth()
  const { tienda } = useTiendas()

  if (!tienda) {
    return <SinTiendas nombre={usuario?.nombre} />
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-4">
        <LogoTienda key={tienda.urlLogo} tienda={tienda} className="size-14 text-xl" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-slate-900">{tienda.nombre}</h1>
          <div className="mt-1">
            <EstadoTienda tienda={tienda} />
          </div>
        </div>
      </div>

      <dl className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <Dato titulo="Plan">{tienda.planNombre ?? 'Sin plan vigente'}</Dato>
        <Dato titulo={tienda.suscripcionTipo === 'PRUEBA' ? 'La prueba termina' : 'Vigente hasta'}>
          {tienda.suscripcionFin ? formatearFecha(tienda.suscripcionFin) : '—'}
        </Dato>
        <Dato titulo="Dirección de la tienda">
          <DireccionTienda tienda={tienda} />
        </Dato>
        <Dato titulo="Creada">{formatearFecha(tienda.creadoEn)}</Dato>
      </dl>

      <AvisoPedidos key={`pedidos-${tienda.id}`} />
      <AvisosInventario key={tienda.id} />

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/panel/configuracion"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar datos de la tienda
        </Link>
        <Link
          to="/panel/tiendas/nueva"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Crear otra tienda
        </Link>
      </div>
    </div>
  )
}
