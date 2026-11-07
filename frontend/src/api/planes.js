import { apiPublica } from './cliente'

/**
 * GET /api/planes → planes activos:
 * [{ id, nombre, descripcion, precio, periodicidad, maxProductos, maxCategorias,
 *    maxImagenesProducto, maxUsuarios, funcionalidades: { estadisticas } }]
 */
export async function listarPlanes() {
  const { data } = await apiPublica.get('/planes')
  return data
}
