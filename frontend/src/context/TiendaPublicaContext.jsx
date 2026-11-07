import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { obtenerTiendaPublica } from '../api/publico'
import { carritoLocal } from '../api/sesion'
import { useDatos } from '../hooks/useDatos'

const TiendaPublicaContext = createContext(null)

const mismaLinea = (a, b) => a.productoId === b.productoId && (a.varianteId ?? null) === (b.varianteId ?? null)

/**
 * Tienda pública que se está visitando y el carrito del visitante en ella.
 * Usar con key={slug}: cada tienda tiene su propio carrito.
 */
export function TiendaPublicaProvider({ slug, children }) {
  const cargar = useCallback(() => obtenerTiendaPublica(slug), [slug])
  const { datos: tienda, cargando, error } = useDatos(cargar)

  const [carrito, setCarrito] = useState(() => carritoLocal.obtener(slug))
  useEffect(() => {
    carritoLocal.guardar(slug, carrito)
  }, [slug, carrito])

  /** Suma `cantidad` a la línea de ese producto y variante, o la crea. */
  const agregar = useCallback((linea) => {
    setCarrito((actual) =>
      actual.some((l) => mismaLinea(l, linea))
        ? actual.map((l) => (mismaLinea(l, linea) ? { ...l, cantidad: l.cantidad + linea.cantidad } : l))
        : [...actual, { productoId: linea.productoId, varianteId: linea.varianteId ?? null, cantidad: linea.cantidad }],
    )
  }, [])

  const cambiarCantidad = useCallback((linea, cantidad) => {
    setCarrito((actual) => actual.map((l) => (mismaLinea(l, linea) ? { ...l, cantidad } : l)))
  }, [])

  const quitar = useCallback((linea) => {
    setCarrito((actual) => actual.filter((l) => !mismaLinea(l, linea)))
  }, [])

  const vaciar = useCallback(() => setCarrito([]), [])

  const valor = useMemo(
    () => ({
      slug,
      tienda,
      cargando,
      error,
      carrito,
      cantidadEnCarrito: carrito.reduce((suma, l) => suma + l.cantidad, 0),
      /** Unidades de ese producto y variante que ya están en el carrito. */
      enCarrito: (productoId, varianteId) =>
        carrito.find((l) => mismaLinea(l, { productoId, varianteId }))?.cantidad ?? 0,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [slug, tienda, cargando, error, carrito, agregar, cambiarCantidad, quitar, vaciar],
  )

  return <TiendaPublicaContext.Provider value={valor}>{children}</TiendaPublicaContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- el hook vive junto a su Provider
export function useTiendaPublica() {
  const contexto = useContext(TiendaPublicaContext)
  if (!contexto) {
    throw new Error('useTiendaPublica debe usarse dentro de <TiendaPublicaProvider>')
  }
  return contexto
}
