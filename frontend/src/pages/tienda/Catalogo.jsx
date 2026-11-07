import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { listarCategoriasPublicas, listarProductosPublicos } from '../../api/publico'
import ImagenProducto from '../../components/tienda-publica/ImagenProducto'
import Alerta from '../../components/ui/Alerta'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { ordenarParaVitrina, textoPrecio } from '../../utils/producto'
import { quitarTildes } from '../../utils/texto'

function TarjetaProducto({ producto, base }) {
  const agotado = producto.stock === 0
  return (
    <Link to={`${base}/producto/${producto.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <ImagenProducto
          url={producto.urlImagenPrincipal}
          alt={producto.nombre}
          className={`aspect-square w-full transition-transform group-hover:scale-105 ${agotado ? 'opacity-60' : ''}`}
        />
        {agotado && (
          <span className="absolute top-2 left-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">
            Agotado
          </span>
        )}
        {!agotado && producto.destacado && (
          <span className="absolute top-2 left-2 rounded-full bg-(--tienda) px-2 py-0.5 text-xs font-medium text-(--tienda-texto)">
            Destacado
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium text-slate-900 group-hover:underline">{producto.nombre}</h3>
      <p className="mt-1 text-sm text-slate-700">{textoPrecio(producto)}</p>
    </Link>
  )
}

export default function Catalogo() {
  const { slug, tienda } = useTiendaPublica()
  const base = `/tienda/${slug}`
  const [parametros, setParametros] = useSearchParams()
  const categoriaId = parametros.get('categoria') ?? ''
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(() => Promise.all([listarProductosPublicos(slug), listarCategoriasPublicas(slug)]), [slug])
  const { datos, cargando, error } = useDatos(cargar)
  const [productos, categorias] = datos ?? [[], []]

  const termino = quitarTildes(busqueda.trim())
  const visibles = ordenarParaVitrina(
    productos
      .filter((p) => !categoriaId || String(p.categoriaId) === categoriaId)
      .filter((p) => !termino || quitarTildes(p.nombre).includes(termino)),
  )

  const chip = (activo) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
      activo ? 'border-transparent bg-(--tienda) text-(--tienda-texto)' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
    }`

  return (
    <>
      {tienda.urlBanner ? (
        <img src={tienda.urlBanner} alt="" className="h-40 w-full object-cover md:h-64" />
      ) : (
        <div className="h-3 bg-(--tienda)" />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{tienda.nombre}</h1>
        {tienda.descripcion && <p className="mt-2 max-w-2xl text-slate-600">{tienda.descripcion}</p>}

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {categorias.length > 0 && (
            <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
              <button type="button" className={chip(!categoriaId)} onClick={() => setParametros({}, { replace: true })}>
                Todo
              </button>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={chip(String(c.id) === categoriaId)}
                  onClick={() => setParametros({ categoria: String(c.id) }, { replace: true })}
                >
                  {c.nombre}
                </button>
              ))}
            </nav>
          )}
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos"
            aria-label="Buscar productos"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 md:w-64"
          />
        </div>

        <div className="mt-6">
          <Alerta>{error}</Alerta>
          {cargando ? (
            <p className="text-slate-500">Cargando productos…</p>
          ) : visibles.length === 0 ? (
            <p className="py-12 text-center text-slate-500">
              {termino || categoriaId ? 'No hay productos que coincidan.' : 'Esta tienda todavía no tiene productos.'}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {visibles.map((producto) => (
                <li key={producto.id}>
                  <TarjetaProducto producto={producto} base={base} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
