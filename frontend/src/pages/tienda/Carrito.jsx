import { useCallback } from 'react'
import { Link } from 'react-router'
import { listarProductosPublicos } from '../../api/publico'
import ImagenProducto from '../../components/tienda-publica/ImagenProducto'
import SelectorCantidad from '../../components/tienda-publica/SelectorCantidad'
import Alerta from '../../components/ui/Alerta'
import { useTiendaPublica } from '../../context/TiendaPublicaContext'
import { useDatos } from '../../hooks/useDatos'
import { formatearSoles } from '../../utils/formato'

/**
 * Cruza cada línea del carrito (solo ids y cantidad) con el catálogo actual:
 * el precio y el stock salen siempre del catálogo, nunca de lo guardado en el navegador.
 */
function resolverLinea(linea, productos) {
  const producto = productos.find((p) => p.id === linea.productoId)
  const variante = linea.varianteId ? producto?.variantes.find((v) => v.id === linea.varianteId) : null
  // Si el producto ahora tiene variantes, una línea sin variante ya no se puede comprar.
  const disponible = Boolean(producto) && (linea.varianteId ? Boolean(variante) : producto.variantes.length === 0)
  const stock = disponible ? (variante?.stock ?? producto.stock) : 0
  const precio = disponible ? Number(variante?.precio ?? producto.precio) : 0
  return { linea, producto, variante, disponible, stock, precio }
}

export default function Carrito() {
  const { slug, carrito, cambiarCantidad, quitar, vaciar } = useTiendaPublica()
  const base = `/tienda/${slug}`
  const cargar = useCallback(() => listarProductosPublicos(slug), [slug])
  const { datos: productos, cargando, error } = useDatos(cargar)

  if (carrito.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Tu carrito está vacío</h1>
        <Link
          to={base}
          className="mt-6 inline-block rounded-lg bg-(--tienda) px-6 py-2.5 font-medium text-(--tienda-texto) hover:brightness-95"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  const lineas = productos ? carrito.map((l) => resolverLinea(l, productos)) : []
  const comprables = lineas.filter((l) => l.disponible && l.stock > 0)
  const total = comprables.reduce((suma, l) => suma + l.precio * Math.min(l.linea.cantidad, l.stock), 0)
  const unidades = comprables.reduce((suma, l) => suma + Math.min(l.linea.cantidad, l.stock), 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Carrito</h1>

      <div className="mt-6">
        <Alerta>{error}</Alerta>
        {cargando ? (
          <p className="text-slate-500">Cargando carrito…</p>
        ) : (
          productos && (
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {lineas.map(({ linea, producto, variante, disponible, stock, precio }) => (
                  <li key={`${linea.productoId}-${linea.varianteId}`} className="flex gap-4 py-4">
                    <ImagenProducto url={producto?.urlImagenPrincipal} alt="" className="size-20 shrink-0 rounded-lg md:size-24" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div className="min-w-0">
                          {producto ? (
                            <Link to={`${base}/producto/${producto.id}`} className="font-medium text-slate-900 hover:underline">
                              {producto.nombre}
                            </Link>
                          ) : (
                            <p className="font-medium text-slate-500">Producto no disponible</p>
                          )}
                          {variante && <p className="text-sm text-slate-500">{variante.nombre}</p>}
                        </div>
                        {disponible && (
                          <p className="font-medium text-slate-900 tabular-nums">
                            {formatearSoles(precio * Math.min(linea.cantidad, stock))}
                          </p>
                        )}
                      </div>

                      {!disponible ? (
                        <p className="mt-2 text-sm text-red-700">Ya no está a la venta.</p>
                      ) : stock === 0 ? (
                        <p className="mt-2 text-sm text-red-700">Agotado.</p>
                      ) : (
                        <>
                          <p className="mt-1 text-sm text-slate-500">{formatearSoles(precio)} c/u</p>
                          {linea.cantidad > stock && (
                            <p className="mt-1 text-sm text-amber-700">
                              Solo quedan {stock}.{' '}
                              <button type="button" className="font-semibold underline" onClick={() => cambiarCantidad(linea, stock)}>
                                Ajustar
                              </button>
                            </p>
                          )}
                        </>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        {disponible && stock > 0 && (
                          <SelectorCantidad
                            valor={Math.min(linea.cantidad, stock)}
                            maximo={stock}
                            onChange={(cantidad) => cambiarCantidad(linea, cantidad)}
                            etiqueta={`Cantidad de ${producto.nombre}`}
                          />
                        )}
                        <button type="button" onClick={() => quitar(linea)} className="text-sm font-medium text-slate-600 hover:text-red-700 hover:underline">
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-semibold text-slate-900">Resumen</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Productos ({unidades})</dt>
                    <dd className="tabular-nums">{formatearSoles(total)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatearSoles(total)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-slate-500">
                  Incluye IGV. Si tienes un código de descuento, lo aplicas al pagar.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-5 w-full rounded-lg bg-(--tienda) px-4 py-2.5 font-medium text-(--tienda-texto) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar con la compra
                </button>
                <p className="mt-2 text-center text-xs text-slate-500">
                  El inicio de sesión y el pago se agregan en la siguiente etapa.
                </p>
                <button type="button" onClick={vaciar} className="mt-4 w-full text-sm text-slate-600 hover:text-red-700 hover:underline">
                  Vaciar carrito
                </button>
              </aside>
            </div>
          )
        )}
      </div>
    </div>
  )
}
