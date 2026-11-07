import { apiPropietario } from './cliente'

// Estadísticas de la tienda actual (X-Tenant-ID). `desde` y `hasta` son fechas 'YYYY-MM-DD';
// sin ellas, el backend usa el mes actual. No cuentan los pedidos cancelados.
//
// Cada nivel depende del plan (funcionalidades.estadisticas). Si no está incluido, responde
// 403 con codigo FUNCIONALIDAD_NO_INCLUIDA:
// - BASICAS (Emprendedor):     /dashboard
// - INTERMEDIAS (Crecimiento): /ventas
// - AVANZADAS (Profesional):   /productos-mas-vendidos

/** { desde, hasta, ventasTotales, pedidosPagados, productosVendidos, clientesCompradores, ticketPromedio } */
export async function obtenerResumen(desde, hasta) {
  const { data } = await apiPropietario.get('/analitica/dashboard', { params: { desde, hasta } })
  return data
}

/** Solo los días con ventas: [{ fecha, cantidadPedidos, productosVendidos, cantidadClientes, montoVentas }] */
export async function obtenerVentasDiarias(desde, hasta) {
  const { data } = await apiPropietario.get('/analitica/ventas', { params: { desde, hasta } })
  return data
}

/** [{ productoId, nombreProducto, cantidadVendida, montoGenerado }], de 1 a 100 (por defecto 5). */
export async function obtenerMasVendidos(desde, hasta, limite = 10) {
  const { data } = await apiPropietario.get('/analitica/productos-mas-vendidos', { params: { desde, hasta, limite } })
  return data
}
