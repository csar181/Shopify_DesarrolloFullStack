import { useEffect } from 'react'
import { Link, Outlet, useParams } from 'react-router'
import LogoTienda from '../components/tienda/LogoTienda'
import { TiendaPublicaProvider, useTiendaPublica } from '../context/TiendaPublicaContext'
import { textoSobre } from '../utils/color'

const COLOR_POR_DEFECTO = '#059669'

function NoDisponible({ mensaje }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Tienda no disponible</h1>
      <p className="mt-2 text-slate-600">{mensaje}</p>
      <Link to="/" className="mt-6 font-medium text-marca-700 hover:underline">
        Ir a ShopCloud
      </Link>
    </div>
  )
}

function Estructura() {
  const { slug, tienda, cargando, error, cantidadEnCarrito } = useTiendaPublica()

  useEffect(() => {
    if (tienda) document.title = tienda.nombre
    return () => {
      document.title = 'ShopCloud'
    }
  }, [tienda])

  if (cargando) {
    return <p className="p-8 text-center text-slate-500">Cargando tienda…</p>
  }
  if (!tienda) {
    return <NoDisponible mensaje={error || 'Esta tienda no existe o todavía no está publicada.'} />
  }

  const color = tienda.colorPrimario || COLOR_POR_DEFECTO
  const base = `/tienda/${slug}`

  return (
    // --tienda y --tienda-texto: color de la marca y un texto legible sobre él (ver utils/color.js).
    <div
      className="flex min-h-screen flex-col bg-white"
      style={{ '--tienda': color, '--tienda-texto': textoSobre(color) }}
    >
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={base} className="flex min-w-0 items-center gap-3">
            <LogoTienda key={tienda.urlLogo} tienda={tienda} className="size-9" />
            <span className="truncate text-lg font-semibold text-slate-900">{tienda.nombre}</span>
          </Link>
          <Link
            to={`${base}/carrito`}
            className="relative flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Carrito
            <span
              aria-label={`${cantidadEnCarrito} productos`}
              className="min-w-6 rounded-full bg-(--tienda) px-1.5 py-0.5 text-center text-xs font-semibold text-(--tienda-texto)"
            >
              {cantidadEnCarrito}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-800">{tienda.nombre}</p>
            {(tienda.correoContacto || tienda.telefonoContacto) && (
              <p className="mt-1">
                {[tienda.correoContacto, tienda.telefonoContacto].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Tienda creada con{' '}
            <Link to="/" className="font-medium hover:underline">
              ShopCloud
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

/** Tienda pública de un comerciante: /tienda/:slug/... */
export default function TiendaPublicaLayout() {
  const { slug } = useParams()
  return (
    <TiendaPublicaProvider key={slug} slug={slug}>
      <Estructura />
    </TiendaPublicaProvider>
  )
}
