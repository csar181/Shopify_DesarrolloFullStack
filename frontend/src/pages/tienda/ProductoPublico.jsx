import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { obtenerProductoPublico } from '../../api/publico'
import ImagenProducto from '../../components/tienda-publica/ImagenProducto'
import SelectorCantidad from '../../components/tienda-publica/SelectorCantidad'
import Alerta from '../../components/ui/Alerta'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearSoles } from '../../utils/formato'
import { textoPrecio } from '../../utils/producto'

function Galeria({ producto }) {
  // La principal primero; el backend envía las URLs en `imagenes` y marca la principal aparte.
  const imagenes = [
    ...new Set([producto.urlImagenPrincipal, ...producto.imagenes].filter(Boolean)),
  ]
  const [elegida, setElegida] = useState(0)

  return (
    <div>
      <ImagenProducto url={imagenes[elegida]} alt={producto.nombre} className="aspect-square w-full rounded-2xl" />
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imagenes.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setElegida(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === elegida}
              className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === elegida ? 'border-(--tienda)' : 'border-transparent'}`}
            >
              <ImagenProducto url={url} className="size-16" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Compra({ producto }) {
  const { slug, agregar, enCarrito } = useTiendaPublica()
  const tieneVariantes = producto.variantes.length > 0
  // Se preselecciona la primera variante con stock.
  const [varianteId, setVarianteId] = useState(() => producto.variantes.find((v) => v.stock > 0)?.id ?? null)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState('')
  const [error, setError] = useState('')
  const [agregando, setAgregando] = useState(false)

  const variante = producto.variantes.find((v) => v.id === varianteId) ?? null
  const stock = tieneVariantes ? (variante?.stock ?? 0) : producto.stock
  // Lo que ya está en el carrito también cuenta contra el stock.
  const disponible = Math.max(0, stock - enCarrito(producto.id, variante?.id ?? null))
  const puedeAgregar = (!tieneVariantes || variante) && disponible > 0 && !agregando

  function elegirVariante(id) {
    setVarianteId(id)
    setCantidad(1)
    setAgregado('')
    setError('')
  }

  // Con sesión iniciada, el backend valida el stock y puede rechazarlo.
  async function agregarAlCarrito() {
    setAgregando(true)
    setAgregado('')
    setError('')
    try {
      await agregar({ productoId: producto.id, varianteId: variante?.id ?? null, cantidad })
      setAgregado(`${cantidad} ${cantidad === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito.`)
      setCantidad(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setAgregando(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-2xl font-semibold text-slate-900">
        {variante ? formatearSoles(variante.precio) : textoPrecio(producto)}
      </p>

      {tieneVariantes && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Opciones</legend>
          <div className="flex flex-wrap gap-2">
            {producto.variantes.map((v) => {
              const elegida = v.id === varianteId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => elegirVariante(v.id)}
                  disabled={v.stock === 0}
                  aria-pressed={elegida}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:border-dashed disabled:text-slate-400 disabled:line-through ${
                    elegida ? 'border-transparent bg-(--tienda) text-(--tienda-texto)' : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {v.nombre}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {stock === 0 ? (
        <p className="font-medium text-slate-500">Agotado</p>
      ) : (
        <div className="space-y-3">
          {stock <= 5 && <p className="text-sm text-amber-700">¡Quedan solo {stock}!</p>}
          <div className="flex flex-wrap items-center gap-3">
            <SelectorCantidad valor={cantidad} onChange={setCantidad} maximo={disponible} disabled={!puedeAgregar} />
            <button
              type="button"
              onClick={agregarAlCarrito}
              disabled={!puedeAgregar}
              className="flex-1 rounded-lg bg-(--tienda) px-6 py-2.5 font-medium text-(--tienda-texto) hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              Agregar al carrito
            </button>
          </div>
          {disponible === 0 && <p className="text-sm text-slate-600">Ya tienes en el carrito todo el stock disponible.</p>}
        </div>
      )}

      <Alerta>{error}</Alerta>
      {agregado && (
        <Alerta tipo="exito">
          {agregado}{' '}
          <Link to={`/tienda/${slug}/carrito`} className="font-semibold underline">
            Ver carrito
          </Link>
        </Alerta>
      )}
    </div>
  )
}

export default function ProductoPublico() {
  const { id } = useParams()
  const { slug } = useTiendaPublica()
  const cargar = useCallback(() => obtenerProductoPublico(slug, id), [slug, id])
  const { datos: producto, cargando, error } = useDatos(cargar)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to={`/tienda/${slug}`} className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
        ← Seguir comprando
      </Link>

      {cargando ? (
        <p className="mt-6 text-slate-500">Cargando producto…</p>
      ) : !producto ? (
        <div className="mt-6">
          <Alerta>{error || 'Producto no encontrado.'}</Alerta>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
          <Galeria key={producto.id} producto={producto} />
          <div>
            {producto.categoriaNombre && (
              <Link
                to={`/tienda/${slug}?categoria=${producto.categoriaId}`}
                className="text-sm font-medium text-slate-500 hover:underline"
              >
                {producto.categoriaNombre}
              </Link>
            )}
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">{producto.nombre}</h1>
            <div className="mt-4">
              <Compra key={producto.id} producto={producto} />
            </div>
            {producto.descripcion && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-sm font-semibold text-slate-900">Descripción</h2>
                <p className="mt-2 whitespace-pre-line text-slate-700">{producto.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
