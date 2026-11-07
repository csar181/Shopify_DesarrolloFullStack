import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  agregarAlCarrito,
  cambiarCantidadEnCarrito,
  configurarAlExpirarSesionCliente,
  iniciarSesionCliente,
  obtenerCarrito,
  quitarDelCarrito,
  registrarCliente,
  sincronizarCarrito,
  vaciarCarrito,
} from '../api/clienteTienda'
import { obtenerTiendaPublica } from '../api/publico'
import { carritoLocal, sesionCliente } from '../api/sesion'
import { useDatos } from '../hooks/useDatos'

const TiendaPublicaContext = createContext(null)

const mismaLinea = (a, b) => a.productoId === b.productoId && (a.varianteId ?? null) === (b.varianteId ?? null)

/** Líneas del carrito del servidor con la misma forma que las del navegador (más el id del elemento). */
const lineasDelServidor = (carrito) =>
  (carrito?.elementos ?? []).map((e) => ({
    productoId: e.productoId,
    varianteId: e.varianteId,
    cantidad: e.cantidad,
    elementoId: e.id,
  }))

/**
 * Tienda pública que se está visitando, el cliente que inició sesión en ella y su carrito.
 *
 * El carrito tiene dos modos:
 * - Sin sesión: vive en el navegador (localStorage), uno por tienda.
 * - Con sesión: vive en el backend. Al iniciar sesión, el del navegador se sincroniza y se vacía.
 * Las operaciones del carrito devuelven promesas y pueden fallar (por ejemplo, sin stock).
 *
 * Usar con key={slug}: cada tienda tiene su propio cliente y su propio carrito.
 */
export function TiendaPublicaProvider({ slug, children }) {
  const cargarTienda = useCallback(() => obtenerTiendaPublica(slug), [slug])
  const { datos: tienda, cargando, error } = useDatos(cargarTienda)

  const [sesion, setSesion] = useState(() => sesionCliente.obtener(slug))
  const conSesion = Boolean(sesion?.token)

  const [enNavegador, setEnNavegador] = useState(() => carritoLocal.obtener(slug))
  useEffect(() => {
    carritoLocal.guardar(slug, enNavegador)
  }, [slug, enNavegador])

  const [enServidor, setEnServidor] = useState(null)
  /** Avisos del backend al sincronizar (productos que ya no existen, cantidades ajustadas al stock). */
  const [advertencias, setAdvertencias] = useState([])

  const salir = useCallback(() => {
    sesionCliente.borrar(slug)
    setSesion(null)
    setEnServidor(null)
    setAdvertencias([])
  }, [slug])

  // Si el token del cliente vence (401), se cierra su sesión en esta tienda.
  useEffect(() => {
    configurarAlExpirarSesionCliente(slug, salir)
  }, [slug, salir])

  // Con sesión, el carrito se lee del backend.
  useEffect(() => {
    if (!conSesion) return
    let vigente = true
    obtenerCarrito(slug)
      .then((carrito) => vigente && setEnServidor(carrito))
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [slug, conSesion])

  /** Guarda la sesión y lleva al backend lo que había en el carrito del navegador. */
  const comenzarSesion = useCallback(
    async (respuesta) => {
      const nueva = {
        token: respuesta.token,
        cliente: { id: respuesta.clienteId, nombre: respuesta.nombre, correoElectronico: respuesta.correoElectronico },
      }
      sesionCliente.guardar(slug, nueva)
      try {
        const carrito = await sincronizarCarrito(slug, enNavegador)
        setEnServidor(carrito)
        setAdvertencias(carrito.advertencias ?? [])
        setEnNavegador([])
      } catch {
        setAdvertencias(['No se pudo recuperar el carrito que tenías antes de iniciar sesión.'])
      }
      setSesion(nueva)
    },
    [slug, enNavegador],
  )

  const entrar = useCallback(
    async (credenciales) => comenzarSesion(await iniciarSesionCliente(slug, credenciales)),
    [slug, comenzarSesion],
  )
  /** Tras editar el perfil: actualiza el nombre guardado en la sesión (lo muestra la cabecera). */
  const actualizarCliente = useCallback(
    (cambios) => {
      setSesion((actual) => {
        if (!actual) return actual
        const nueva = { ...actual, cliente: { ...actual.cliente, ...cambios } }
        sesionCliente.guardar(slug, nueva)
        return nueva
      })
    },
    [slug],
  )

  const crearCuenta = useCallback(
    async (datos) => comenzarSesion(await registrarCliente(slug, datos)),
    [slug, comenzarSesion],
  )

  /** Suma `cantidad` a la línea de ese producto y variante, o la crea. */
  const agregar = useCallback(
    async (linea) => {
      if (conSesion) {
        setEnServidor(await agregarAlCarrito(slug, linea))
        return
      }
      setEnNavegador((actual) =>
        actual.some((l) => mismaLinea(l, linea))
          ? actual.map((l) => (mismaLinea(l, linea) ? { ...l, cantidad: l.cantidad + linea.cantidad } : l))
          : [...actual, { productoId: linea.productoId, varianteId: linea.varianteId ?? null, cantidad: linea.cantidad }],
      )
    },
    [slug, conSesion],
  )

  const cambiarCantidad = useCallback(
    async (linea, cantidad) => {
      if (conSesion) {
        setEnServidor(await cambiarCantidadEnCarrito(slug, linea.elementoId, cantidad))
        return
      }
      setEnNavegador((actual) => actual.map((l) => (mismaLinea(l, linea) ? { ...l, cantidad } : l)))
    },
    [slug, conSesion],
  )

  const quitar = useCallback(
    async (linea) => {
      if (conSesion) {
        await quitarDelCarrito(slug, linea.elementoId)
        setEnServidor(await obtenerCarrito(slug))
        return
      }
      setEnNavegador((actual) => actual.filter((l) => !mismaLinea(l, linea)))
    },
    [slug, conSesion],
  )

  const vaciar = useCallback(async () => {
    if (conSesion) {
      await vaciarCarrito(slug)
      setEnServidor(null)
      return
    }
    setEnNavegador([])
  }, [slug, conSesion])

  /** Después de comprar, el backend ya cerró ese carrito: se vuelve a pedir (vendrá vacío). */
  const recargarCarrito = useCallback(async () => {
    if (conSesion) setEnServidor(await obtenerCarrito(slug))
  }, [slug, conSesion])

  const carrito = useMemo(
    () => (conSesion ? lineasDelServidor(enServidor) : enNavegador),
    [conSesion, enServidor, enNavegador],
  )

  const valor = useMemo(
    () => ({
      slug,
      tienda,
      cargando,
      error,
      cliente: sesion?.cliente ?? null,
      entrar,
      crearCuenta,
      salir,
      actualizarCliente,
      carrito,
      cantidadEnCarrito: carrito.reduce((suma, l) => suma + l.cantidad, 0),
      /** Unidades de ese producto y variante que ya están en el carrito. */
      enCarrito: (productoId, varianteId) =>
        carrito.find((l) => mismaLinea(l, { productoId, varianteId }))?.cantidad ?? 0,
      advertencias,
      descartarAdvertencias: () => setAdvertencias([]),
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      recargarCarrito,
    }),
    [slug, tienda, cargando, error, sesion, entrar, crearCuenta, salir, actualizarCliente, carrito, advertencias, agregar, cambiarCantidad, quitar, vaciar, recargarCarrito],
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
