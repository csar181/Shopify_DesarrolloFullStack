import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tiendaActual as tiendaGuardada } from '../api/sesion'
import { listarMisTiendas } from '../api/tiendas'

const TiendaContext = createContext(null)

/**
 * Tiendas del propietario y la que está administrando ahora.
 * El id de la tienda actual se guarda en localStorage y apiPropietario lo envía en X-Tenant-ID.
 */
export function TiendaProvider({ children }) {
  const [tiendas, setTiendas] = useState([])
  const [tiendaId, setTiendaId] = useState(() => tiendaGuardada.obtener())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const seleccionar = useCallback((id) => {
    tiendaGuardada.guardar(id)
    setTiendaId(id)
  }, [])

  const recargar = useCallback(
    () =>
      listarMisTiendas()
        .then((lista) => {
          setTiendas(lista)
          setError('')
          // Si la tienda guardada ya no está en la lista (o no había), se toma la primera.
          const guardada = tiendaGuardada.obtener()
          const valida = lista.some((t) => t.id === guardada) ? guardada : (lista[0]?.id ?? null)
          tiendaGuardada.guardar(valida)
          setTiendaId(valida)
        })
        .catch((e) => setError(e.message))
        .finally(() => setCargando(false)),
    [],
  )

  useEffect(() => {
    recargar()
  }, [recargar])

  /** Agrega o reemplaza una tienda con la respuesta del backend, sin volver a pedir la lista. */
  const guardarEnLista = useCallback((tienda) => {
    setTiendas((actuales) =>
      actuales.some((t) => t.id === tienda.id)
        ? actuales.map((t) => (t.id === tienda.id ? tienda : t))
        : [...actuales, tienda],
    )
  }, [])

  const valor = useMemo(
    () => ({
      tiendas,
      tienda: tiendas.find((t) => t.id === tiendaId) ?? null,
      cargando,
      error,
      seleccionar,
      recargar,
      guardarEnLista,
    }),
    [tiendas, tiendaId, cargando, error, seleccionar, recargar, guardarEnLista],
  )

  return <TiendaContext.Provider value={valor}>{children}</TiendaContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- el hook vive junto a su Provider
export function useTiendas() {
  const contexto = useContext(TiendaContext)
  if (!contexto) {
    throw new Error('useTiendas debe usarse dentro de <TiendaProvider>')
  }
  return contexto
}
