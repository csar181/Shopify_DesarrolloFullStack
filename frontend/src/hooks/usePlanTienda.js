import { useEffect, useState } from 'react'
import { listarPlanes } from '../api/planes'
import { useTiendas } from '../context/TiendaContext'

/**
 * Plan vigente de la tienda actual, con sus límites (maxProductos, maxCategorias,
 * maxImagenesProducto). Es null mientras carga o si la tienda no tiene suscripción vigente.
 */
export function usePlanTienda() {
  const { tienda } = useTiendas()
  const [planes, setPlanes] = useState([])

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch(() => setPlanes([]))
  }, [])

  return planes.find((plan) => plan.nombre === tienda?.planNombre) ?? null
}
