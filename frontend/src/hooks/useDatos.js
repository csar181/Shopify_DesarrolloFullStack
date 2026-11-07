import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carga datos de la API al montar el componente.
 * `cargar` debe ser estable (envuelta en useCallback) o se volverá a pedir en cada render.
 *
 *   const cargar = useCallback(() => listarCategorias(), [])
 *   const { datos, cargando, error, recargar, setDatos } = useDatos(cargar)
 *
 * `datos` es null hasta que la primera carga termina bien: no muestres formularios
 * que agreguen elementos a la lista mientras sea null.
 */
export function useDatos(cargar) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' })
  // Cada carga y cada setDatos aumentan la versión. Una respuesta que llega cuando ya hubo
  // otra carga o un cambio local más reciente se descarta para no pisarlos.
  const version = useRef(0)

  const recargar = useCallback(() => {
    const miVersion = ++version.current
    return cargar()
      .then((datos) => {
        if (miVersion === version.current) setEstado({ datos, cargando: false, error: '' })
      })
      .catch((e) => {
        if (miVersion === version.current) setEstado((actual) => ({ ...actual, cargando: false, error: e.message }))
      })
  }, [cargar])

  useEffect(() => {
    recargar()
  }, [recargar])

  /** Actualiza los datos en memoria con la respuesta de un POST/PUT, sin volver a pedirlos. */
  const setDatos = useCallback((cambio) => {
    version.current++
    setEstado((actual) => ({
      ...actual,
      datos: typeof cambio === 'function' ? cambio(actual.datos) : cambio,
    }))
  }, [])

  return { ...estado, recargar, setDatos }
}
