import { useCallback, useEffect, useState } from 'react'

/**
 * Carga datos de la API al montar el componente.
 * `cargar` debe ser estable (envuelta en useCallback) o se volverá a pedir en cada render.
 *
 *   const cargar = useCallback(() => listarCategorias(), [])
 *   const { datos, cargando, error, recargar, setDatos } = useDatos(cargar)
 */
export function useDatos(cargar) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' })

  const recargar = useCallback(
    () =>
      cargar()
        .then((datos) => setEstado({ datos, cargando: false, error: '' }))
        .catch((e) => setEstado((actual) => ({ ...actual, cargando: false, error: e.message }))),
    [cargar],
  )

  useEffect(() => {
    recargar()
  }, [recargar])

  /** Actualiza los datos en memoria con la respuesta de un POST/PUT, sin volver a pedirlos. */
  const setDatos = useCallback((cambio) => {
    setEstado((actual) => ({
      ...actual,
      datos: typeof cambio === 'function' ? cambio(actual.datos) : cambio,
    }))
  }, [])

  return { ...estado, recargar, setDatos }
}
