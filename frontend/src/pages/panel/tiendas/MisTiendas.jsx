import { Link, useNavigate } from 'react-router'
import DireccionTienda from '../../../components/tienda/DireccionTienda'
import EstadoTienda from '../../../components/tienda/EstadoTienda'
import LogoTienda from '../../../components/tienda/LogoTienda'
import Boton from '../../../components/ui/Boton'
import { useTiendas } from '../../../context/TiendaContext'

export default function MisTiendas() {
  const { tiendas, tienda: actual, seleccionar } = useTiendas()
  const navegar = useNavigate()

  function administrar(id) {
    seleccionar(id)
    navegar('/panel')
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mis tiendas</h1>
          <p className="mt-1 text-sm text-slate-600">Elige qué tienda administrar o crea una nueva.</p>
        </div>
        <Link
          to="/panel/tiendas/nueva"
          className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700"
        >
          Nueva tienda
        </Link>
      </div>

      {tiendas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-600">
          Todavía no tienes tiendas.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiendas.map((t) => {
            const esActual = t.id === actual?.id
            return (
              <li
                key={t.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 ${
                  esActual ? 'border-marca-600 ring-1 ring-marca-600' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <LogoTienda key={t.urlLogo} tienda={t} />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{t.nombre}</h2>
                    <p className="truncate text-sm text-slate-500">
                      <DireccionTienda tienda={t} />
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <EstadoTienda tienda={t} />
                  {t.planNombre && <span>Plan {t.planNombre}</span>}
                </div>
                <div className="mt-5 flex-1 content-end">
                  {esActual ? (
                    <p className="text-sm font-medium text-marca-700">Estás administrando esta tienda</p>
                  ) : (
                    <Boton variante="secundario" className="w-full" onClick={() => administrar(t.id)}>
                      Administrar
                    </Boton>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
