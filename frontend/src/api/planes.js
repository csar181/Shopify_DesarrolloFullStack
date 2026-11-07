import { apiPublica } from './cliente'

let planesEnCache = null

/**
 * GET /api/planes → planes activos:
 * [{ id, nombre, descripcion, precio, periodicidad, maxProductos, maxCategorias,
 *    maxImagenesProducto, maxUsuarios, funcionalidades: { estadisticas } }]
 *
 * Casi nunca cambian, así que se piden una sola vez por visita.
 */
export function listarPlanes() {
  if (!planesEnCache) {
    planesEnCache = apiPublica.get('/planes').then(({ data }) => data)
    // Si falla, se descarta para que el próximo intento vuelva a pedirlos.
    planesEnCache.catch(() => {
      planesEnCache = null
    })
  }
  return planesEnCache
}
